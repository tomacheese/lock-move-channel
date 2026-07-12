import {
  APIEmbed,
  BaseGuild,
  BaseInteraction,
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from 'discord.js'
import { Logger } from '@book000/node-utils'
import { Config } from './config'
import { BaseDiscordEvent } from './events'
import { BaseCommand } from './commands'
import { RegisterCommand } from './commands/register'
import { UnregisterCommand } from './commands/unregister'
import { LoadCommand } from './commands/load'
import { LockCommand } from './commands/lock'
import { SaveCommand } from './commands/save'
import { UnlockCommand } from './commands/unlock'
import { CreatedChannelEvent } from './events/created-channel'
import { DeletedChannelEvent } from './events/deleted-channel'
import { MovedChannelEvent } from './events/moved-channel'
import { StartedAutoLockEvent } from './events/started-auto-lock'

export class Discord {
  private config: Config
  public readonly client: Client
  public readonly rest: REST

  private onInteractionFunction: (interaction: BaseInteraction) => void

  public static readonly routes: BaseCommand[] = [
    new RegisterCommand(),
    new UnregisterCommand(),
    new LoadCommand(),
    new SaveCommand(),
    new LockCommand(),
    new UnlockCommand(),
  ]

  constructor(config: Config) {
    const logger = Logger.configure('Discord.constructor')
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
      partials: [Partials.Channel, Partials.GuildMember],
    })
    this.client = client
    this.client.on('ready', () => {
      ;(async () => {
        try {
          await this.onReady()
        } catch (error) {
          logger.error('❌ Failed to run onReady', error as Error)
        }
      })()
    })
    this.onInteractionFunction = (interaction) => {
      ;(async () => {
        try {
          await this.onInteractionCreate(interaction)
        } catch (error) {
          logger.error('❌ Failed to run onInteractionCreate', error as Error)
        }
      })()
    }
    this.client.on('interactionCreate', this.onInteractionFunction)

    const events: BaseDiscordEvent<any>[] = [
      new StartedAutoLockEvent(this),
      new CreatedChannelEvent(this),
      new MovedChannelEvent(this),
      new DeletedChannelEvent(this),
    ]
    for (const event of events) {
      event.register()
    }

    ;(async () => {
      try {
        await client.login(config.get('discord').token)
      } catch (error) {
        const loginLogger = Logger.configure('Discord.constructor')
        loginLogger.error('Failed to login to Discord.', error as Error)
      }
    })()
    this.rest = new REST().setToken(config.get('discord').token)

    this.config = config
  }

  public getClient() {
    return this.client
  }

  public getConfig() {
    return this.config
  }

  public async close() {
    await this.client.destroy()
  }

  async onReady() {
    const logger = Logger.configure('Discord.onReady')
    logger.info(`👌 ready: ${this.client.user?.tag}`)

    await this.updateAllGuildCommands()

    // 1時間ごとに interactionCreate を再登録する
    setInterval(
      () => {
        const logger = Logger.configure('Discord.onReady.setInterval')
        logger.info('🔄 Re-registering interactionCreate handler')
        this.client.off('interactionCreate', this.onInteractionFunction)
        this.client.on('interactionCreate', this.onInteractionFunction)

        ;(async () => {
          try {
            await this.updateAllGuildCommands()
          } catch (error) {
            logger.error('❌ Failed to update commands', error as Error)
          }
        })()
      },
      1000 * 60 * 60
    )
  }

  async onInteractionCreate(interaction: BaseInteraction) {
    if (!interaction.isChatInputCommand()) {
      return
    }

    if (interaction.command?.name !== 'lock-move-channel') {
      return
    }
    const guild = interaction.guild
    if (!guild) {
      return
    }
    const command = Discord.routes.find((route) => {
      const group = interaction.options.getSubcommandGroup()
      const subcommand = interaction.options.getSubcommand()
      const definition = route.definition(guild)
      return definition?.name === (group ?? subcommand)
    })
    if (!command) return

    if (command.permissions) {
      const permissions = command.permissions.map((permission) => {
        if (permission.identifier) {
          switch (permission.type) {
            case 'USER': {
              return interaction.user.id === permission.identifier
            }
            case 'ROLE': {
              if (!interaction.guild) {
                return false
              }
              return (
                interaction.guild.members
                  .resolve(interaction.user)
                  ?.roles.cache.has(permission.identifier) ?? false
              )
            }
            case 'PERMISSION': {
              if (!interaction.guild) {
                return false
              }
              return (
                interaction.guild.members
                  .resolve(interaction.user)
                  ?.permissions.has(permission.identifier) ?? false
              )
            }
          }
        }
        return true
      })
      if (!permissions.every(Boolean)) {
        await interaction.reply({
          content: 'このコマンドを実行する権限がありません。',
          ephemeral: true,
        })
        return
      }
    }
    await command.execute(this, interaction)
  }

  async updateAllGuildCommands() {
    const logger = Logger.configure('Discord.updateAllGuildCommands')
    logger.info('🔄 Updating commands')

    const guilds = await this.client.guilds.fetch()
    for (const guild of guilds.values()) {
      await this.updateCommands(guild)
    }

    logger.info('👌 Commands updated')
  }

  async updateCommands(guild: BaseGuild) {
    const logger = Logger.configure('Discord.updateCommands')
    logger.info(`🖥️ Guild: ${guild.name} (${guild.id})`)

    if (!this.client.application) {
      throw new Error('Client#Application is not found.')
    }

    const builder = new SlashCommandBuilder()
      .setName('lock-move-channel')
      .setDescription('Discord Event Notifier')

    for (const route of Discord.routes) {
      if (!route.conditions(guild)) {
        continue
      }
      const definition = route.definition(guild)
      if (!definition) {
        continue
      }
      logger.info('🖥️ SubCommand: ' + definition.name)
      if (definition instanceof SlashCommandSubcommandBuilder) {
        builder.addSubcommand(definition)
      }
      if (definition instanceof SlashCommandSubcommandGroupBuilder) {
        builder.addSubcommandGroup(definition)
      }
    }

    await this.client.application.commands.create(builder.toJSON(), guild.id)
  }

  async sendSuccess(
    interaction: ChatInputCommandInteraction,
    embed: Omit<APIEmbed, 'color' | 'timestamp' | 'footer'>,
    shouldUpdateCommands = true
  ): Promise<void> {
    if (!interaction.guild) return
    if (!interaction.deferred) await interaction.deferReply()

    const footer = shouldUpdateCommands
      ? {
          text: 'コマンドの再登録を行っています…。',
        }
      : undefined
    await interaction.editReply({
      embeds: [
        {
          ...embed,
          color: 0xff_a5_00,
          footer,
          timestamp: new Date().toISOString(),
        },
      ],
    })

    if (!shouldUpdateCommands) return

    await this.updateCommands(interaction.guild)

    await interaction.editReply({
      embeds: [
        {
          ...embed,
          footer: {
            text: 'コマンドの再登録が完了しました。',
          },
          color: 0x00_ff_00,
          timestamp: new Date().toISOString(),
        },
      ],
    })
  }

  async sendError(
    interaction: ChatInputCommandInteraction,
    embed: Omit<APIEmbed, 'color' | 'timestamp' | 'footer'>
  ): Promise<void> {
    if (!interaction.guild) return
    if (!interaction.deferred) await interaction.deferReply()
    await interaction.editReply({
      embeds: [
        {
          ...embed,
          color: 0xff_00_00,
          timestamp: new Date().toISOString(),
        },
      ],
    })
  }

  waitReady() {
    return new Promise<void>((resolve) => {
      if (this.client.isReady()) {
        resolve()
      }
      this.client.once('ready', () => {
        resolve()
      })
    })
  }
}

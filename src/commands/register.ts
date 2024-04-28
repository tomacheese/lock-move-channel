import {
  ChatInputCommandInteraction,
  BaseGuild,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandBuilder,
  ChannelType,
  GuildBasedChannel,
  TextBasedChannel,
} from 'discord.js'
import { BaseCommand, Permission } from '.'
import { LockMoveChannelServer } from '@/server'
import { Discord } from '@/discord'
import { Logger } from '@book000/node-utils'

/**
 * lock-move-channel register
 *
 * このサーバを対象サーバに設定する。
 */
export class RegisterCommand implements BaseCommand {
  definition():
    | SlashCommandSubcommandBuilder
    | SlashCommandSubcommandGroupBuilder
    | null {
    return new SlashCommandSubcommandBuilder()
      .setName('register')
      .setDescription(
        'このサーバを lock-move-channel の対象サーバに設定します。'
      )
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription(
            'チャンネルが移動され、戻した際の通知を受け取るチャンネルを指定します。指定しない場合はこのチャンネルが使用されます。'
          )
          .setRequired(false)
          .addChannelTypes(ChannelType.GuildText)
      )
  }

  conditions(guild: BaseGuild): boolean {
    const server = new LockMoveChannelServer(guild)
    return !server.isRegistered()
  }

  get permissions(): Permission[] {
    return [
      {
        identifier: 'ManageGuild',
        type: 'PERMISSION',
      },
    ]
  }

  async execute(
    discord: Discord,
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const logger = Logger.configure(this.constructor.name + '.execute')
    await interaction.deferReply()

    if (!interaction.guild) {
      await discord.sendError(interaction, {
        title: '❌ 登録に失敗',
        description: 'このコマンドはDiscordサーバ内でのみ実行できます。',
      })
      return
    }

    const guild = interaction.guild
    const channel = await this.getSelectedChannel(discord, interaction)
    if (!channel) {
      return
    }

    const server = new LockMoveChannelServer(interaction.guild)
    await server.register(channel)
    logger.info(`✅ Registered: ${guild.name} (${guild.id})`)

    await discord.sendSuccess(interaction, {
      title: '✅ 登録に成功',
      description:
        `このサーバを lock-move-channel の対象サーバに設定し、通知先チャンネルを <#${channel.id}> に設定しました。\n` +
        'このサーバにあるチャンネルが移動されたときに、自動で元の順番に戻します。意図的に並び順を変えるときは、`/lock-move-channel unlock` を使用してください。',
    })
  }

  private async getSelectedChannel(
    discord: Discord,
    interaction: ChatInputCommandInteraction
  ): Promise<(GuildBasedChannel & TextBasedChannel) | undefined> {
    const channel = interaction.options.getChannel<ChannelType.GuildText>(
      'channel',
      false
    )
    if (channel) {
      return channel
    }

    if (!interaction.channel) {
      await discord.sendError(interaction, {
        title: '❌ 登録に失敗',
        description: 'チャンネル情報の取得に失敗しました。',
      })
      return
    }
    if (!interaction.channel.isTextBased() || interaction.channel.isDMBased()) {
      await discord.sendError(interaction, {
        title: '❌ 登録に失敗',
        description: 'サーバのテキストチャンネルを指定してください。',
      })
      return
    }

    return interaction.channel
  }
}

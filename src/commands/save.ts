import {
  CacheType,
  ChatInputCommandInteraction,
  BaseGuild,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js'
import { BaseCommand, Permission } from '.'
import { Discord } from '@/discord'
import { Logger } from '@book000/node-utils'
import { LockMoveChannelServer } from '@/server'

/**
 * lock-move-channel save
 *
 * チャンネル順番を保存する。
 */
export class SaveCommand implements BaseCommand {
  definition():
    | SlashCommandSubcommandBuilder
    | SlashCommandSubcommandGroupBuilder
    | null {
    return new SlashCommandSubcommandBuilder()
      .setName('save')
      .setDescription('チャンネル順番を保存します。')
  }

  conditions(guild: BaseGuild): boolean {
    const server = new LockMoveChannelServer(guild)
    return server.isRegistered()
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
    interaction: ChatInputCommandInteraction<CacheType>
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
    const server = new LockMoveChannelServer(guild)

    await server.savePositions()
    logger.info(`✅ Successfully save positions: ${guild.name} (${guild.id})`)

    await discord.sendSuccess(
      interaction,
      {
        title: '✅ チャンネル順番の保存に成功',
        description: 'チャンネル順番を保存しました。',
      },
      false
    )
  }
}

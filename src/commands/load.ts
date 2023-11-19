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
 * lock-move-channel load
 *
 * チャンネル順番を保存した内容に従って並び替え（復元）する。
 */
export class LoadCommand implements BaseCommand {
  definition():
    | SlashCommandSubcommandBuilder
    | SlashCommandSubcommandGroupBuilder
    | null {
    return new SlashCommandSubcommandBuilder()
      .setName('load')
      .setDescription('チャンネル順番を保存した内容に従って並び替えます。')
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
        title: '❌ 登録解除に失敗',
        description: 'このコマンドはDiscordサーバ内でのみ実行できます。',
      })
      return
    }

    const guild = interaction.guild
    const server = new LockMoveChannelServer(guild)

    try {
      const changes = await server.loadPositions()
      logger.info(
        `✅ Successfully load positions: ${guild.name} (${guild.id}) -> ${changes.length} changes`
      )

      await discord.sendSuccess(
        interaction,
        {
          title: '✅ チャンネル並び替え完了',
          description: `チャンネル並び替えが完了しました。\n${changes.length} チャンネルの並び替えを行いました。`,
        },
        false
      )
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        await discord.sendError(interaction, {
          title: '❌ チャンネル並び替え中止',
          description: 'チャンネル並び替えが中止されました。',
        })
        return
      }

      throw error
    }
  }
}

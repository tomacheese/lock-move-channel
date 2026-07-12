import {
  ChatInputCommandInteraction,
  BaseGuild,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js'
import { BaseCommand, Permission } from '.'
import { Discord } from '@/discord'
import { Logger } from '@book000/node-utils'
import { LockMoveChannelServer } from '@/server'
import { AutoLockManager } from '@/manager/auto-lock-manager'

/**
 * lock-move-channel unlock
 *
 * チャンネル並び替えのロックを解除する。
 */
export class UnlockCommand implements BaseCommand {
  definition():
    SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | null {
    return new SlashCommandSubcommandBuilder()
      .setName('unlock')
      .setDescription('チャンネル並び替えのロックを解除します。')
  }

  conditions(guild: BaseGuild): boolean {
    const server = new LockMoveChannelServer(guild)
    return server.isRegistered() && server.isLocked()
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
    const server = new LockMoveChannelServer(guild)
    if (!server.isLocked()) {
      await discord.sendError(interaction, {
        title: '❌ ロック解除に失敗',
        description:
          'このサーバでは、チャンネル並び替えはロックされていません。',
      })
      return
    }

    server.setLocked(false)
    logger.info(`🔓 Unlocked channel positon: ${guild.name} (${guild.id})`)

    await discord.sendSuccess(interaction, {
      title: '🔓 ロック解除に成功',
      description:
        'チャンネル並び替えのロックを解除しました。\n5分後に自動的に再ロックされます。',
    })

    const autoLockManager = AutoLockManager.instance
    ;(async () => {
      await autoLockManager.set(guild, discord, interaction)
    })()
  }
}

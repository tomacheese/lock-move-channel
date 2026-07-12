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
 * lock-move-channel lock
 *
 * チャンネル並び替えをロックする。
 */
export class LockCommand implements BaseCommand {
  definition():
    SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | null {
    return new SlashCommandSubcommandBuilder()
      .setName('lock')
      .setDescription('チャンネル並び替えをロックします。')
  }

  conditions(guild: BaseGuild): boolean {
    const server = new LockMoveChannelServer(guild)
    return server.isRegistered() && !server.isLocked()
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
        title: '❌ 登録解除に失敗',
        description: 'このコマンドはDiscordサーバ内でのみ実行できます。',
      })
      return
    }

    const guild = interaction.guild
    const server = new LockMoveChannelServer(guild)
    if (server.isLocked()) {
      await discord.sendError(interaction, {
        title: '❌ ロックに失敗',
        description: '既にロックされています。',
      })
      return
    }

    server.setLocked(true)
    await server.savePositions()
    logger.info(`🔐 Locked channel positon: ${guild.name} (${guild.id})`)

    await discord.sendSuccess(interaction, {
      title: '🔐 ロックに成功',
      description: 'チャンネル並び替えをロックしました。',
    })

    const autoLockManager = AutoLockManager.instance
    autoLockManager.cancel(guild)
  }
}

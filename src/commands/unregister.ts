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

/**
 * lock-move-channel unregister
 *
 * このサーバを対象サーバから外す。
 */
export class UnregisterCommand implements BaseCommand {
  definition():
    | SlashCommandSubcommandBuilder
    | SlashCommandSubcommandGroupBuilder
    | null {
    return new SlashCommandSubcommandBuilder()
      .setName('unregister')
      .setDescription(
        'このサーバの lock-move-channel の対象サーバから外します。'
      )
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

    const server = new LockMoveChannelServer(interaction.guild)
    server.unregister()

    logger.info(`✅ Unregistered guild: ${guild.name} (${guild.id})`)
    await discord.sendSuccess(interaction, {
      title: '✅ 登録解除に成功',
      description:
        'このサーバを lock-move-channel の対象サーバから外しました。',
    })
  }
}

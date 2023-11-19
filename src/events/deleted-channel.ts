import { LockMoveChannelServer } from '@/server'
import { BaseDiscordEvent } from '.'
import { Logger } from '@book000/node-utils'
import { DMChannel, NonThreadGuildBasedChannel } from 'discord.js'

/**
 * チャンネルが削除されたとき、チャンネル並び順を保存する
 */
export class DeletedChannelEvent extends BaseDiscordEvent<'channelDelete'> {
  get eventName(): 'channelDelete' {
    return 'channelDelete'
  }

  async execute(
    channel: DMChannel | NonThreadGuildBasedChannel
  ): Promise<void> {
    const logger = Logger.configure(this.constructor.name + '.execute')
    if (channel.isDMBased()) {
      return
    }
    const guild = channel.guild

    const server = new LockMoveChannelServer(guild)
    if (!server.isRegistered()) {
      return
    }

    await server.savePositions()
    logger.info(
      `✅ Deleted channel: ${guild.name} (${guild.id}) -> ${channel.name} (${channel.id}). Saved positions.`
    )
  }
}

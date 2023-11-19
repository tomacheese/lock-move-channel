import { LockMoveChannelServer } from '@/server'
import { BaseDiscordEvent } from '.'
import { Logger } from '@book000/node-utils'
import { NonThreadGuildBasedChannel } from 'discord.js'

/**
 * チャンネルが作成されたとき、チャンネル並び順を保存する
 */
export class CreatedChannelEvent extends BaseDiscordEvent<'channelCreate'> {
  get eventName(): 'channelCreate' {
    return 'channelCreate'
  }

  async execute(channel: NonThreadGuildBasedChannel): Promise<void> {
    const logger = Logger.configure(this.constructor.name + '.execute')
    const guild = channel.guild

    const server = new LockMoveChannelServer(guild)
    if (!server.isRegistered()) {
      return
    }

    await server.savePositions()
    logger.info(
      `✅ Created channel: ${guild.name} (${guild.id}) -> ${channel.name} (${channel.id}). Saved positions.`
    )
  }
}

import { LockMoveChannelServer } from '@/server'
import { BaseDiscordEvent } from '.'
import { Logger } from '@book000/node-utils'
import { NonThreadGuildBasedChannel } from 'discord.js'

export class CreatedChannelEvent extends BaseDiscordEvent<'channelCreate'> {
  readonly eventName = 'channelCreate'

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

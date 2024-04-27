import { LockMoveChannelServer } from '@/server'
import { BaseDiscordEvent } from '.'
import { Logger } from '@book000/node-utils'

/**
 * アプリケーションが起動したとき、すべてのサーバのチャンネル並び替えをロック状態にする
 */
export class StartedAutoLockEvent extends BaseDiscordEvent<'ready'> {
  readonly eventName = 'ready'

  async execute(): Promise<void> {
    const logger = Logger.configure(this.constructor.name + '.execute')
    const client = this.discord.getClient()
    const serverIds = LockMoveChannelServer.getServerIds()
    for (const serverId of serverIds) {
      const guild = await client.guilds.fetch(serverId)
      const server = new LockMoveChannelServer(guild)

      if (server.isLocked()) {
        continue
      }

      server.setLocked(true)
      await server.savePositions()
      logger.info(`✅ Locked: ${guild.name} (${guild.id})`)
    }
  }
}

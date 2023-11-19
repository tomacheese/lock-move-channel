import { LockMoveChannelServer } from '@/server'
import {
  ChangedChannelPosition,
  MovedChannelManager,
} from './moved-channel-manager'

/**
 * チャンネル順番復元中の状態を管理する
 */
export class PositionLoadManager {
  private static readonly _instance = new PositionLoadManager()
  private loadController: Map<string, AbortController> = new Map()

  // eslint-disable-next-line no-useless-constructor
  private constructor() {}

  load(server: LockMoveChannelServer): Promise<ChangedChannelPosition[]> {
    return new Promise((resolve, reject) => {
      const id = server.id

      if (
        this.loadController.has(id) &&
        !this.loadController.get(id)?.signal.aborted
      ) {
        return reject(new Error('Already loading.'))
      }

      const abortController = new AbortController()
      this.loadController.set(id, abortController)
      this.run(server)
        .then((changes) => {
          this.loadController.delete(id)
          resolve(changes)
        })
        .catch((error) => {
          this.loadController.delete(id)
          reject(error)
        })

      abortController.signal.addEventListener(
        'abort',
        () => {
          reject(new Error('Aborted.'))
        },
        { once: true }
      )
    })
  }

  public cancel(server: LockMoveChannelServer): void {
    const id = server.id
    const controller = this.loadController.get(id)
    if (!controller) {
      return
    }
    controller.abort()
    this.loadController.delete(id)
  }

  private async run(
    server: LockMoveChannelServer
  ): Promise<ChangedChannelPosition[]> {
    const guild = await server.getGuild()
    const channels = await guild.channels.fetch()

    const movedChannelManager = MovedChannelManager.instance
    movedChannelManager.delete(guild)

    const positions = server.getPositions()

    for (const channel of channels.values()) {
      if (channel === null) {
        continue
      }

      const expectPosition = positions.find((p) => p.id === channel.id)
      if (!expectPosition) {
        continue
      }

      if (
        channel.parentId === expectPosition.parent &&
        channel.position === expectPosition.position
      ) {
        continue
      }

      await channel.setParent(expectPosition.parent, {
        lockPermissions: false,
        reason: 'Loaded channel position by lock-move-channel',
      })
      await channel.setPosition(expectPosition.position, {
        reason: 'Loaded channel position by lock-move-channel',
      })
    }

    return movedChannelManager.get(guild) ?? []
  }

  static get instance(): PositionLoadManager {
    return this._instance
  }
}

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
  private loadController = new Map<string, AbortController>()

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  load(server: LockMoveChannelServer): Promise<ChangedChannelPosition[]> {
    return new Promise((resolve, reject) => {
      const id = server.id

      if (
        this.loadController.has(id) &&
        !this.loadController.get(id)?.signal.aborted
      ) {
        reject(new Error('Already loading.'))
        return
      }

      const abortController = new AbortController()
      this.loadController.set(id, abortController)
      this.run(server)
        .then((changes) => {
          this.loadController.delete(id)
          resolve(changes)
        })
        .catch((error: unknown) => {
          this.loadController.delete(id)
          reject(error as Error)
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

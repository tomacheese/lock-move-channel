import { ChatInputCommandInteraction, Guild } from 'discord.js'
import { setTimeout } from 'node:timers/promises'
import { LockMoveChannelServer } from '../server'
import { Logger } from '@book000/node-utils'
import { Discord } from '@/discord'

/**
 * 自動ロックを管理する
 */
export class AutoLockManager {
  private static readonly _instance = new AutoLockManager()
  private lockController = new Map<string, AbortController>()

  private readonly seconds = 5 * 60

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  set(
    guild: Guild,
    discord: Discord,
    interaction: ChatInputCommandInteraction
  ): void {
    const id = guild.id

    if (this.lockController.has(id)) this.cancel(guild)

    const abortController = new AbortController()
    this.lockController.set(id, abortController)
    setTimeout(this.seconds * 1000, null, { signal: abortController.signal })
      .then(() => {
        this.lockController.delete(id)
        const server = new LockMoveChannelServer(guild)
        server.setLocked(true)
        server
          .savePositions()
          .then(() => {
            return discord.sendSuccess(interaction, {
              title: '🔐 再ロック完了',
              description:
                '5分経過したため、チャンネル並び替えをロックしました。',
            })
          })
          .then(() => {
            const logger = Logger.configure(this.constructor.name + '.set')
            logger.info(`✅ Auto Locked: ${guild.name} (${guild.id})`)
          })
          .catch((error: unknown) => {
            const logger = Logger.configure(this.constructor.name + '.set')
            logger.error('❌ Auto Lock Error', error as Error)
          })
      })
      .catch((error: unknown) => {
        const logger = Logger.configure(this.constructor.name + '.set')
        logger.error('❌ Auto Lock Error', error as Error)

        if ((error as Error).name === 'AbortError') {
          return discord.sendError(interaction, {
            title: '❌ 再ロックに失敗',
            description: '再ロック処理が中断されました。',
          })
        }

        return discord.sendError(interaction, {
          title: '❌ 再ロックに失敗',
          description: `エラーが発生したため、再ロック処理に失敗しました。\n\nErrorName: ${(error as Error).name}\nErrorMessage: ${(error as Error).message}`,
        })
      })
      .finally(() => {
        this.lockController.delete(id)
      })
  }

  cancel(guild: Guild): void {
    const id = guild.id
    const controller = this.lockController.get(id)
    if (!controller) {
      return
    }
    controller.abort()
    this.lockController.delete(id)
  }

  static get instance(): AutoLockManager {
    return this._instance
  }
}

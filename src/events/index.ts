import { Discord } from '@/discord'
import { ClientEvents } from 'discord.js'
import { Logger } from '@book000/node-utils'

export abstract class BaseDiscordEvent<T extends keyof ClientEvents> {
  protected readonly discord: Discord

  constructor(discord: Discord) {
    this.discord = discord
  }

  abstract get eventName(): T

  register(): void {
    const logger = Logger.configure('BaseDiscordEvent.register')
    this.discord.client.on(this.eventName, (...eventArguments) => {
      this.execute(...eventArguments).catch((error: unknown) => {
        logger.error(`❌ Failed to run ${this.eventName}`, error as Error)
      })
    })
  }

  abstract execute(...eventArguments: ClientEvents[T]): Promise<void>
}

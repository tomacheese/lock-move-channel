import { BaseGuild, NonThreadGuildBasedChannel } from 'discord.js'

export interface ChangedChannelPosition {
  id: string
  name: string
  oldParent: string | null
  newParent: string | null
  oldPosition: number
  newPosition: number
}

/**
 * 移動されたチャンネルを管理する
 */
export class MovedChannelManager {
  private static readonly _instance = new MovedChannelManager()
  private movedChannels = new Map<string, ChangedChannelPosition[]>()

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static get instance(): MovedChannelManager {
    return this._instance
  }

  public get(guild: BaseGuild): ChangedChannelPosition[] | null {
    return this.movedChannels.get(guild.id) ?? null
  }

  public add(
    guild: BaseGuild,
    detail: {
      channel: NonThreadGuildBasedChannel
      oldParent: string | null
      oldPosition: number
      newParent: string | null
      newPosition: number
    }
  ): void {
    const guildMovedChannels = this.movedChannels.get(guild.id) ?? []
    const movedChannel = guildMovedChannels.find(
      (movedChannel) => movedChannel.id === detail.channel.id
    )
    if (movedChannel) {
      movedChannel.newParent = detail.newParent
      movedChannel.newPosition = detail.newPosition
    } else {
      guildMovedChannels.push({
        id: detail.channel.id,
        name: detail.channel.name,
        oldParent: detail.oldParent,
        oldPosition: detail.oldPosition,
        newParent: detail.newParent,
        newPosition: detail.newPosition,
      })
    }

    this.movedChannels.set(guild.id, guildMovedChannels)
  }

  public delete(guild: BaseGuild): void {
    this.movedChannels.delete(guild.id)
  }

  public clear(): void {
    this.movedChannels.clear()
  }
}

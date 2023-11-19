import { Logger } from '@book000/node-utils'
import {
  BaseGuild,
  Guild,
  GuildBasedChannel,
  NonThreadGuildBasedChannel,
  TextBasedChannel,
} from 'discord.js'
import fs from 'node:fs'
import { PositionLoadManager } from './manager/position-load-manager'
import { ChangedChannelPosition } from './manager/moved-channel-manager'

interface LockMoveChannelPosition {
  id: string
  parent: string | null
  position: number
}

interface LockMoveChannelServerData {
  id: string
  name: string
  channelId: string
  isLocked: boolean
  positions: LockMoveChannelPosition[]
}

/**
 * lock-move-channel の対象サーバを表すクラス
 */
export class LockMoveChannelServer {
  private readonly path: string
  private readonly guild: BaseGuild

  constructor(guild: BaseGuild) {
    this.guild = guild

    const baseServerDirectory = process.env.BASE_SERVER_DIR
      ? `${process.env.BASE_SERVER_DIR}/`
      : 'data/servers/'
    if (!fs.existsSync(baseServerDirectory)) {
      fs.mkdirSync(baseServerDirectory, { recursive: true })
    }

    this.path = `${baseServerDirectory}${guild.id}.json`
  }

  /**
   * サーバを登録する
   *
   * @param channel 通知用チャンネル
   */
  async register(channel: GuildBasedChannel & TextBasedChannel): Promise<void> {
    if (fs.existsSync(this.path)) {
      throw new Error('Server is already registered.')
    }

    const positions = await this.getChannelPositions()

    const data: LockMoveChannelServerData = {
      id: this.guild.id,
      name: this.guild.name,
      channelId: channel.id,
      isLocked: true,
      positions,
    }

    fs.writeFileSync(this.path, JSON.stringify(data, null, 2))
  }

  /**
   * サーバの登録を解除する
   */
  unregister(): void {
    if (!fs.existsSync(this.path)) {
      throw new Error('Server is not registered.')
    }

    fs.unlinkSync(this.path)
  }

  /**
   * チャンネル並び替えのロック状態を変更する
   *
   * @param isLocked ロックするかどうか
   */
  setLocked(isLocked: boolean): void {
    if (!fs.existsSync(this.path)) {
      throw new Error('Server is not registered.')
    }

    const data: LockMoveChannelServerData = JSON.parse(
      fs.readFileSync(this.path, 'utf8')
    )
    if (data.isLocked === isLocked) {
      throw new Error('Server is already locked.')
    }
    data.isLocked = isLocked
    fs.writeFileSync(this.path, JSON.stringify(data, null, 2))
  }

  loadPositions(): Promise<ChangedChannelPosition[]> {
    const manager = PositionLoadManager.instance
    return manager.load(this)
  }

  async savePositions(): Promise<void> {
    if (!fs.existsSync(this.path)) {
      throw new Error('Server is not registered.')
    }

    const positions = await this.getChannelPositions()

    const data: LockMoveChannelServerData = JSON.parse(
      fs.readFileSync(this.path, 'utf8')
    )
    data.positions = positions
    fs.writeFileSync(this.path, JSON.stringify(data, null, 2))
  }

  getPositions(): LockMoveChannelPosition[] {
    if (!fs.existsSync(this.path)) {
      throw new Error('Server is not registered.')
    }

    const data: LockMoveChannelServerData = JSON.parse(
      fs.readFileSync(this.path, 'utf8')
    )
    return data.positions
  }

  async getNotifyChannel(): Promise<
    (GuildBasedChannel & TextBasedChannel) | null
  > {
    const logger = Logger.configure(this.constructor.name + '.getNotifyChannel')
    const channelId = this.getNotifyChannelId()
    if (!channelId) {
      return null
    }

    const guild = await this.guild.fetch()
    const channel = await guild.channels.fetch(channelId)
    if (!channel) {
      logger.warn(
        `Channel not found: ${channelId} in ${guild.name} (${guild.id})`
      )
      return null
    }
    if (!channel.isTextBased()) {
      logger.warn(
        `Channel is not text based: ${channelId} in ${guild.name} (${guild.id})`
      )
      return null
    }

    return channel
  }

  async getGuild(): Promise<Guild> {
    return await this.guild.fetch()
  }

  isRegistered() {
    return fs.existsSync(this.path)
  }

  isLocked() {
    if (!fs.existsSync(this.path)) {
      throw new Error('Server is not registered.')
    }

    const data: LockMoveChannelServerData = JSON.parse(
      fs.readFileSync(this.path, 'utf8')
    )
    return data.isLocked
  }

  get id(): string {
    return this.guild.id
  }

  static getServerIds(): string[] {
    const baseServerDirectory = process.env.BASE_SERVER_DIR
      ? `${process.env.BASE_SERVER_DIR}/`
      : 'data/servers/'
    if (!fs.existsSync(baseServerDirectory)) {
      fs.mkdirSync(baseServerDirectory, { recursive: true })
    }

    const files = fs.readdirSync(baseServerDirectory)
    return files.map((file) => file.replace(/\.json$/, ''))
  }

  private getNotifyChannelId(): string | null {
    if (!fs.existsSync(this.path)) {
      return null
    }

    const data: LockMoveChannelServerData = JSON.parse(
      fs.readFileSync(this.path, 'utf8')
    )
    return data.channelId
  }

  private async getChannelPositions(): Promise<LockMoveChannelPosition[]> {
    const guild = await this.guild.fetch()
    const channels = await guild.channels.fetch()

    const positions: LockMoveChannelPosition[] = channels
      .filter(
        (channel): channel is NonThreadGuildBasedChannel => channel !== null
      )
      .map((channel) => {
        return {
          id: channel.id,
          parent: channel.parentId,
          position: channel.position,
        }
      })

    return positions
  }
}

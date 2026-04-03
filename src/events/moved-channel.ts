import { LockMoveChannelServer } from '@/server'
import { BaseDiscordEvent } from '.'
import { Logger } from '@book000/node-utils'
import { APIEmbed, DMChannel, NonThreadGuildBasedChannel } from 'discord.js'
import { MovedChannelManager } from '@/manager/moved-channel-manager'

/**
 * チャンネルが削除されたとき、以下の処理を行う
 * - サーバでチャンネル並び替えがロックされている場合、並び順をもとに戻す
 * - チャンネル並び替えがロックされていない場合、並び順を保存する
 */
export class MovedChannelEvent extends BaseDiscordEvent<'channelUpdate'> {
  readonly eventName = 'channelUpdate'

  async execute(
    oldChannel: DMChannel | NonThreadGuildBasedChannel,
    newChannel: DMChannel | NonThreadGuildBasedChannel
  ): Promise<void> {
    const logger = Logger.configure(this.constructor.name + '.execute')
    if (oldChannel.isDMBased() || newChannel.isDMBased()) {
      return
    }

    const guild = newChannel.guild
    const server = new LockMoveChannelServer(guild)
    if (!server.isRegistered()) {
      return
    }

    const channelName = newChannel.name
    const oldPosition = oldChannel.position
    const newPosition = newChannel.position
    const oldRawPosition = oldChannel.rawPosition
    const newRawPosition = newChannel.rawPosition

    if (oldRawPosition === newRawPosition) {
      return
    }

    if (!server.isLocked()) {
      // ロックされていない場合、並び順を保存する
      await server.savePositions()
      logger.info(
        `✅ Moved channel[Unlocked]: ${guild.name} (${guild.id}) -> ${newChannel.name} (${newChannel.id}). Saved positions.`
      )
      return
    }

    // ロックされている場合、並び順をもとに戻す
    logger.info(
      `⏩ Moved channel[Locked]: ${guild.name} (${guild.id}) -> ${channelName} (${newChannel.id}). ${oldPosition} -> ${newPosition} (${oldRawPosition} -> ${newRawPosition})`
    )
    // 並び順をもとに戻したチャンネルを管理する
    const movedChannelManager = MovedChannelManager.instance
    movedChannelManager.add(guild, {
      channel: newChannel,
      oldParent: oldChannel.parentId,
      oldPosition,
      newParent: newChannel.parentId,
      newPosition,
    })

    try {
      const rawChanges = await server.loadPositions()
      const changes = rawChanges.filter(
        (change) =>
          change.oldParent !== change.newParent ||
          change.oldPosition !== change.newPosition
      )
      logger.info(
        `✅ Successfully load positions: ${guild.name} (${guild.id}) -> ${changes.length} changes`
      )

      // 並び順をもとに戻したチャンネルについて、通知する
      const notifyChannel = await server.getNotifyChannel()
      if (!notifyChannel) {
        logger.info(
          `❌ Notify channel is not found: ${guild.name} (${guild.id})`
        )
        return
      }

      // 10件だけ表示する
      const fields = changes
        .map((change) => {
          return {
            name: `<#${change.id}>`,
            value: `**カテゴリ**: <#${change.oldParent}> -> <#${change.newParent}>\n**位置**: \`${change.oldPosition}\` -> \`${change.newPosition}\``,
            inline: true,
          }
        })
        .slice(0, 10)

      const description =
        changes.length > 0
          ? `${changes.length} チャンネルの並び直しを行いました。`
          : 'チャンネルの並び直しを行いました。'

      const embed: APIEmbed = {
        title: '🔒 チャンネル移動検知',
        description,
        fields,
        color: 0x00_ff_00,
      }

      await notifyChannel.send({ embeds: [embed] })
      logger.info(
        `✅ Successfully notified: ${guild.name} (${guild.id}) -> ${notifyChannel.name} (${notifyChannel.id})`
      )
    } catch (err) {
      if ((err as Error).message === 'Already loading.') {
        return
      }
      if ((err as Error).name === 'AbortError') {
        logger.info(
          `❌ Abort load positions: ${guild.name} (${guild.id}) -> ${channelName} (${newChannel.id})`
        )
        return
      }

      logger.error('❌ Failed to load positions: ', err as Error)
    }
  }
}

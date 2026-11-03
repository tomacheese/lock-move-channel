import { LockMoveChannelServer } from '@/server'
import { BaseDiscordEvent } from '.'
import { Logger } from '@book000/node-utils'
import { APIEmbed, DMChannel, NonThreadGuildBasedChannel } from 'discord.js'
import { MovedChannelManager } from '@/manager/moved-channel-manager'

/**
 * On channel update:
 * - if reordering is locked, restores the saved order
 * - if not locked, saves the new order
 */
export class MovedChannelEvent extends BaseDiscordEvent<'channelUpdate'> {
  readonly eventName = 'channelUpdate'

  async execute(
    oldChannel: DMChannel | NonThreadGuildBasedChannel,
    newChannel: DMChannel | NonThreadGuildBasedChannel
  ): Promise<void> {
    if (oldChannel.isDMBased() || newChannel.isDMBased()) {
      return
    }
    const logger = Logger.configure(this.constructor.name + '.execute')

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
      await server.savePositions()
      logger.info(
        `✅ Moved channel[Unlocked]: ${guild.name} (${guild.id}) -> ${newChannel.name} (${newChannel.id}). Saved positions.`
      )
      return
    }

    logger.info(
      `⏩ Moved channel[Locked]: ${guild.name} (${guild.id}) -> ${channelName} (${newChannel.id}). ${oldPosition} -> ${newPosition} (${oldRawPosition} -> ${newRawPosition})`
    )
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

      const notifyChannel = await server.getNotifyChannel()
      if (!notifyChannel) {
        logger.info(
          `❌ Notify channel is not found: ${guild.name} (${guild.id})`
        )
        return
      }

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
    } catch (error) {
      if ((error as Error).message === 'Already loading.') {
        return
      }
      if ((error as Error).name === 'AbortError') {
        logger.info(
          `❌ Abort load positions: ${guild.name} (${guild.id}) -> ${channelName} (${newChannel.id})`
        )
        return
      }

      logger.error('❌ Failed to load positions: ', error as Error)
    }
  }
}

import config from 'config'
import {
  CategoryChannel,
  Client,
  GuildMemberRoleManager,
  NonThreadGuildBasedChannel,
  TextChannel,
} from 'discord.js'
import fs from 'fs'

let saving = false

export async function saveChannelPositions(client: Client) {
  if (saving) return
  const guildId = config.get<string>('guildId')
  console.log('Saving channel positions...')
  saving = true
  const guild = await client.guilds.fetch(guildId)
  const channels = await guild.channels.fetch()
  const channelPositions: {
    [key: string]: {
      parent: string | null
      position: number
    }
  } = {}
  for (const channel of channels.values()) {
    if (channel === null) continue
    channelPositions[channel.id] = {
      parent: channel.parent ? channel.parent.id : null,
      position: channel.position,
    }
  }
  fs.writeFileSync('positions.json', JSON.stringify(channelPositions))
  console.log('Channel positions saved.')
  saving = false
}

export async function loadChannelPositions(client: Client) {
  const guildId = config.get<string>('guildId')
  if (!fs.existsSync('positions.json')) {
    return
  }
  console.log('Loading channel positions...')

  const positions: {
    [key: string]: {
      parent: string | null
      position: number
    }
  } = JSON.parse(fs.readFileSync('positions.json').toString())
  const guild = await client.guilds.fetch(guildId)
  const channels = await guild.channels.fetch()
  for (const channel of channels.values()) {
    const p = positions[channel.id]
    if (!p) {
      continue
    }
    if (channel.parentId === p.parent && channel.position === p.position) {
      continue
    }
    console.log(
      'Changing position #' +
        channel.name +
        ': ' +
        channel.position +
        ' -> ' +
        p.position +
        ' (' +
        channel.parentId +
        ' -> ' +
        p.parent +
        ')'
    )
    await report(
      client,
      channel,
      p.parent,
      p.position,
      channel.parentId,
      channel.position
    )
    await channel.setParent(p.parent, {
      lockPermissions: false,
      reason: 'lock-move-channel',
    })
    await channel.setPosition(p.position, {
      reason: 'lock-move-channel',
    })
  }
  console.log('Channel positions loaded.')
}

async function report(
  client: Client,
  oldChannel: NonThreadGuildBasedChannel,
  oldParentId: string | null,
  oldPosition: number,
  newParentId: string | null,
  newPosition: number
) {
  const reportChannelId = config.get<string>('reportChannelId')
  const reportChannel = await client.channels.fetch(reportChannelId)
  if (!reportChannel) return
  if (!(reportChannel instanceof TextChannel)) return
  const oldParent = oldParentId
    ? ((await client.channels.fetch(oldParentId)) as CategoryChannel)
    : null
  const newParent = newParentId
    ? ((await client.channels.fetch(newParentId)) as CategoryChannel)
    : null
  reportChannel.send({
    embeds: [
      {
        title: `チャンネルの移動を検知 : #${oldChannel.name}`,
        fields: [
          {
            name: 'カテゴリ',
            value:
              '`' +
              (oldParent ? oldParent.name : 'NULL') +
              '` -> `' +
              (newParent ? newParent.name : 'NULL') +
              '`',
            inline: true,
          },
          {
            name: '位置',
            value: '`' + oldPosition + '` -> `' + newPosition + '`',
            inline: true,
          },
        ],
        color: 0xff0000,
      },
    ],
  })
}

export function isCommandAllow(roles: GuildMemberRoleManager | undefined) {
  if (!roles) return false
  const allowRoles = config.get<string[]>('commandAllowRoleIds')
  return roles.cache.some((role) => allowRoles.includes(role.id))
}

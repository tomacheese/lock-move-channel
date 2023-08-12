import config from 'config'
import {
  ApplicationCommandDataResolvable,
  Client,
  DMChannel,
  GuildMemberRoleManager,
  NonThreadGuildBasedChannel,
} from 'discord.js'
import {
  isCommandAllow,
  loadChannelPositions,
  saveChannelPositions,
} from './lib'

const guildId = config.get<string>('guildId')
let locked = true

let loading = false

const client = new Client({
  intents: ['Guilds', 'GuildMessages', 'GuildMessageReactions'],
})

client.on('ready', async () => {
  console.log(`ready: ${client.user?.tag}`)

  await saveChannelPositions(client)

  const guild = await client.guilds.fetch(guildId)
  const commands: ApplicationCommandDataResolvable[] = [
    {
      name: 'position-lock',
      description: 'チャンネルの位置を移動できないようにします。',
    },
    {
      name: 'position-unlock',
      description: 'チャンネルの位置を移動できるようにします。',
    },
    {
      name: 'position-save',
      description: 'チャンネルの位置を保存します。',
    },
    {
      name: 'position-load',
      description: 'チャンネルの位置を読み込み、反映します。',
    },
  ]
  for (const command of commands) {
    await guild.commands.create(command)
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) {
    return
  }
  const command = interaction.command
  if (!command) return
  if (!isCommandAllow(interaction.member?.roles as GuildMemberRoleManager)) {
    await interaction.reply('このコマンドは実行できません。')
    return
  }
  await interaction.deferReply()
  if (command.name === 'position-lock') {
    await saveChannelPositions(client)
    locked = true
    interaction.editReply('チャンネルの位置を移動できないようにしました。')
  }
  if (command.name === 'position-unlock') {
    await saveChannelPositions(client)
    locked = false
    await interaction.editReply(
      'チャンネルの位置を移動できるようにしました。5分後に再度ロックされます。',
    )
    setTimeout(
      () => {
        locked = true
        interaction.editReply('5分経過したため、再ロックしました。')
      },
      5 * 60 * 1000,
    )
  }
  if (command.name === 'position-save') {
    await saveChannelPositions(client)
    await interaction.editReply('チャンネルの位置を保存しました。')
  }
  if (command.name === 'position-load') {
    await loadChannelPositions(client)
    await interaction.editReply('チャンネルの位置を読み込みました。')
  }
})

client.on('channelCreate', async (channel) => {
  if (channel instanceof DMChannel) {
    return
  }
  if (channel.guildId !== guildId) return

  await saveChannelPositions(client)
})

client.on('channelDelete', async (channel) => {
  if (channel instanceof DMChannel) {
    return
  }
  if (channel.guildId !== guildId) return

  await saveChannelPositions(client)
})

client.on(
  'channelUpdate',
  async (
    oldTempChannel: DMChannel | NonThreadGuildBasedChannel,
    newTempChannel: DMChannel | NonThreadGuildBasedChannel,
  ) => {
    if (
      oldTempChannel instanceof DMChannel &&
      newTempChannel instanceof DMChannel
    ) {
      return
    }
    const oldChannel = oldTempChannel as NonThreadGuildBasedChannel
    const newChannel = newTempChannel as NonThreadGuildBasedChannel
    if (oldChannel.guildId !== guildId) return

    if (loading) {
      return
    }
    if (!locked) {
      await saveChannelPositions(client)
      return
    }

    console.log(
      oldChannel.name,
      oldChannel.rawPosition,
      newChannel.rawPosition,
      oldChannel.rawPosition === newChannel.rawPosition,
    )

    if (oldChannel.rawPosition === newChannel.rawPosition) return

    loading = true
    await loadChannelPositions(client)
    loading = false
  },
)

client
  .login(config.get('discordToken'))
  .then(() => console.log('Login Successful.'))

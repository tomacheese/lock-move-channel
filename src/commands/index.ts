import { Discord } from '@/discord'
import {
  BaseGuild,
  ChatInputCommandInteraction,
  PermissionResolvable,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from 'discord.js'

interface UserPermission {
  readonly identifier: string
  readonly type: 'USER'
}

interface RolePermission {
  readonly identifier: string
  readonly type: 'ROLE'
}

interface PermissionPermission {
  readonly identifier: PermissionResolvable
  readonly type: 'PERMISSION'
}

export type Permission = UserPermission | RolePermission | PermissionPermission

export abstract class BaseCommand {
  /** Slash subcommand definition */
  abstract definition(
    guild: BaseGuild
  ): SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | null

  /** Whether the command is registered for the given guild */
  abstract conditions(guild: BaseGuild): boolean

  /** Users, roles or permissions required to run the subcommand. null allows everyone */
  abstract get permissions(): Permission[] | null

  /** Subcommand handler */
  abstract execute(
    discord: Discord,
    interaction: ChatInputCommandInteraction
  ): Promise<void>
}

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
  /** 定義: スラッシュサブコマンド */
  abstract definition(
    guild: BaseGuild
  ): SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | null

  /** 定義: 各サーバへの登録条件 */
  abstract conditions(guild: BaseGuild): boolean

  /** 権限: サブコマンドの実行に必要なユーザー・ロール・パーミッション。NULLが指定された場合はすべて許可 */
  abstract get permissions(): Permission[] | null

  /** 実行: サブコマンドの実行定義 */
  abstract execute(
    discord: Discord,
    interaction: ChatInputCommandInteraction
  ): Promise<void>
}

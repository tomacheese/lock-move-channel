# AGENTS.md

## Language

- Write commit descriptions, PR/Issue text, code comments/docstrings and documents in English.
- Exceptions: end-user-facing notification/UI text (Discord embeds, slash command descriptions), Japanese data patterns/fixtures, quotations, technical identifiers, the Japanese fork-PR approval comment text in workflows and its `body-includes` match key (they must match each other), and `package.json` (always English).
- Error messages are written in English.

## Overview

A Discord bot that detects channel moves and automatically restores the saved order. It supports locking channel positions per server, auto-restore, and slash commands (`/lock-move-channel register|unregister|save|load|lock|unlock`).

- Stack: TypeScript, Node.js (version in `.node-version`), discord.js, `@book000/node-utils` (`Logger`, `ConfigFramework`), pnpm.

## Commands

```bash
pnpm install       # install dependencies
pnpm dev           # run with tsx watch
pnpm start         # run with tsx
pnpm lint          # prettier + eslint + tsc
pnpm fix           # prettier + eslint auto-fix
pnpm compile       # tsc -p .
pnpm package       # clean -> compile -> ncc (output/)
```

There are no tests.

## Architecture

- `src/main.ts`: entry point. Loads `data/config.json` and starts `Discord`.
- `src/config.ts`: `ConfigInterface` and validation. Keep it in sync with `schema/Configuration.json` (and `README.md` when settings change).
- `src/discord.ts`: Discord client. Slash commands are listed in `Discord.routes`; a new command goes in `src/commands/` and must be imported and added there.
- `src/commands/`: slash subcommand implementations (`BaseCommand`).
- `src/events/`: Discord event handlers (`BaseDiscordEvent`).
- `src/manager/`: singletons for moved channels, restore-in-progress state and the 5-minute auto re-lock.
- `src/server.ts`: `LockMoveChannelServer`, per-guild state persisted as JSON.

## Conventions and invariants

- Never enable `skipLibCheck` to work around type errors.
- If an existing message has a leading emoji, give new messages a single leading emoji too.
- Document functions and interfaces with English docstrings.
- Do not commit credentials. The Discord token lives in `data/config.json`; do not log it or other sensitive data.
- Config path: `data/config.json`, overridable with `CONFIG_PATH` / `CONFIG_FILE` (handled by `ConfigFramework`). The Docker image sets `CONFIG_PATH=/data/config.json`.
- Per-server data lives in `data/servers/<guildId>.json`, overridable with `BASE_SERVER_DIR` (`/data/servers/` in Docker). Keep persistence under `data/` in mind for Docker.
- Channel reordering and restoring hit the Discord API; be mindful of rate limits.
- Do not add commits to Renovate-created PRs.
- Branches follow Conventional Branch; commits follow Conventional Commits.

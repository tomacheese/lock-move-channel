# Copilot review instructions

Development rules, commands and architecture are in `AGENTS.md`; do not duplicate them here.

## Already enforced (do not flag)

- Formatting is enforced by Prettier (`.prettierrc.yml`) and linting by `@book000/eslint-config`; CI runs `pnpm lint` (prettier + eslint + tsc).

## Review focus

- Language: comments and docstrings in English; error messages in English (user-facing Discord text may be Japanese).
- Type safety: `skipLibCheck` must not be enabled to hide type errors; flag needless `any` or type assertions.
- Secrets: the Discord token must not appear in code, logs or commits.
- Discord API: rate limits, intents/permissions, and side effects of destructive operations (reordering, deleting channels).
- Config schema: `schema/Configuration.json` and `ConfigInterface` in `src/config.ts` stay consistent; update `README.md` when needed.
- Commands: a new slash command lives in `src/commands/` and is registered in `Discord.routes` in `src/discord.ts`.

## Known patterns (do not flag)

- There are no tests; absence of tests alone is not blocking.
- Running directly with `tsx` is the intended way; a missing build output in development is not a defect.
- `Logger` / `ConfigFramework` from `@book000/node-utils` are the intended logging/config approach.

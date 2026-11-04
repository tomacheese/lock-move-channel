# lock-move-channel

Detects and undoes Discord channel moves.

## Requirements

- Native Node.js or Docker
- A valid Discord bot and token

## Features

- You can lock down channel reordering on multiple Discord servers with just one application running.
- If you want to sort intentionally, you can temporarily unlock.
- Can create and delete channels even when locked
- Works with Docker Compose

## Installation

Works in Node.js or Docker Compose environment.

### Docker Compose (Recommended)

If you want to use Docker Compose, write the following in `compose.yaml`:

```yaml
services:
  app:
    image: ghcr.io/tomacheese/lock-move-channel
    volumes:
      - type: bind
        source: ./data
        target: /data/
    init: true
    restart: always
```

You can then refer to the [configuration section](#configuration) to create a configuration file and then launch it with `docker compose up -d`.

### Native Node.js

Use the Node.js version listed in `.node-version` and pnpm.

Clone the repository, create a configuration file with reference to the [Configuration section](#configuration), then run:

```bash
pnpm install
pnpm start
```

## Configuration

The configuration file `data/config.json` is used by default.  
If the environment variable `CONFIG_PATH` or `CONFIG_FILE` is set and the file exists, it is used instead.

Per-server data is stored in `data/servers/` (override with `BASE_SERVER_DIR`).

See here for the JSON Schema of the configuration file: [schema/Configuration.json](schema/Configuration.json)

```json
{
  "$schema": "https://raw.githubusercontent.com/tomacheese/lock-move-channel/master/schema/Configuration.json"
}
```

## License

The license for this project is [MIT License](LICENSE).

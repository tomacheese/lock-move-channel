# lock-move-channel

Detects and undoes Discord channel moves.

## Requirements

- Native Node.js or Docker
- Vaild Discord bot & token

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

If you are running in a Node.js environment, Node.js v20 is recommended.

Download and extract `lock-move-channel_vX.Y.Z.zip` from the [release page](https://github.com/tomacheese/lock-move-channel/releases) in the latest release.  
After that, you can start it with `node index.js` after creating a configuration file with reference to [Configuration section](#configuration).

## Configuration

The configuration file `data/config.json` is used by default.  
If the environment variable `CONFIG_FILE` or `CONFIG_PATH` is set, the specified value is taken as the path to the configuration file.

See here for the JSON Schema of the configuration file: [schema/Configuration.json](schema/Configuration.json)

```json
{
  "$schema": "https://raw.githubusercontent.com/tomacheese/lock-move-channel/master/schema/Configuration.json"
}
```

## License

The license for this project is [MIT License](LICENSE).

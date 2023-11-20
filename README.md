# lock-move-channel

Detects and undoes Discord channel moves.

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

After that, you can start it with `docker compose up -d` after creating a configuration file with reference to [Configuration section](#configuration).

### Node.js

If you are running in a Node.js environment, Node.js v18 is recommended.

Download and extract `twitter-dm-memo_vX.Y.Z.zip` from the [release page](https://github.com/tomacheese/twitter-dm-memo/releases) in the latest release.  
After that, you can start it with `node index.js` after creating a configuration file with reference to [Configuration section](#configuration).

## Configuration

The configuration file `data/config.json` is used by default.  
If the environment variable `CONFIG_FILE` or `CONFIG_PATH` is set, the specified value is taken as the path to the configuration file.

See here for the JSON Schema of the configuration file: [schema/Configuration.json](schema/Configuration.json)

```json
{
  "$schema": "https://raw.githubusercontent.com/tomacheese/twitter-dm-memo/master/schema/Configuration.json"
}
```

## License

The license for this project is [MIT License](LICENSE).

# ble-mqtt

Forwards BLE advertisements to MQTT.
Based on [EspruinoHub](https://github.com/espruino/EspruinoHub).

```bash
yarn global add ble-mqtt

ble-mqtt -c /path/to/config.json
```

## Running through Docker

The below commands expect the `config.json` to be in `/etc/ble-mqtt`.

```
docker build --no-cache -t ble-mqtt:latest .
```

```
docker run -d \
  --rm \
  --name ble-mqtt \
  --net=host \
  --env NOBLE_HCI_DEVICE_ID=0 \
  -v /etc/ble-mqtt:/etc/ble-mqtt \
  ble-mqtt:latest
```

### Running the Docker container as a systemd service

1. Copy `ble-mqtt.service` to `/etc/systemd/system/`
2. To enable start after boot, run `sudo systemctl enable ble-mqtt`
3. Run `sudo service ble-mqtt start`

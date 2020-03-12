import noble, {Peripheral, Advertisement} from '@abandonware/noble';
import json5 from 'json5';
import {promisify} from 'util';

import {logger} from './logger';
import {Config} from './config';
import {decodeAttributeData} from './attributes';
import {MqttClient} from './mqtt';
import {withoutEmpty} from './util';

type ManufacturerData = {
  code: string;
  data: Buffer;
};

const ESPRUINO_MANUFACTURER_ID = '0590';
const BLE_ADVERTISE = '/ble/advertise';

const log = logger('Discovery');

let config: Config;
let mqttClient: MqttClient;

const onStateChange = async (state: string) => {
  switch (state) {
    case 'poweredOn': {
      await new Promise((resolve, reject) => noble.startScanning([], true, (error) => error ? reject(error) : resolve()));
      log.info('Started BLE scanning.');
      return;
    }

    case 'poweredOff': {
      log.warn('BLE powered off.');
      return;
    }
  }
};

const isKnownDevice = (peripheral: Peripheral): boolean =>
  Boolean(config.knownDevices[peripheral.address]);

const getDeviceId = (peripheral: Peripheral): string => {
  const deviceAddress = peripheral.address;
  const knownDeviceName = config.knownDevices[deviceAddress];

  return knownDeviceName || deviceAddress;
}

const parseManufacturerData = (manufacturerData: Buffer): ManufacturerData => ({
  code: manufacturerData.slice(0, 2).reverse().toString('hex'),
  data: manufacturerData.slice(2)
})

const sendPeripheralData = async (deviceId: string, peripheral: Peripheral): Promise<void> => {
  const mqttData = {
    rssi: peripheral.rssi,
    name: peripheral.advertisement.localName,
    manufacturerData: peripheral.advertisement.manufacturerData?.toString('hex')
  };

  await mqttClient.send(`${BLE_ADVERTISE}/${deviceId}`, withoutEmpty(mqttData));
}

const sendObjectEntries = async (topicPrefix: string, obj: object): Promise<void> => {
  for (const [key, value] of Object.entries(obj)) {
    await mqttClient.send(`${topicPrefix}/${key}`, value);
  }
}

const sendEspruinoDataIfPresent = async (deviceId: string, code: string, data: Buffer): Promise<void> => {
  if (code !== ESPRUINO_MANUFACTURER_ID) {
    return;
  }

  const dataAscii = data.slice(2).toString('ascii');

  try {
    const dataJson = json5.parse(dataAscii);

    if (!dataJson || typeof dataJson !== 'object') {
      return;
    }

    await sendObjectEntries(`${BLE_ADVERTISE}/${deviceId}`, dataJson);
  } catch (e) {
    log.error(`Malformed JSON received in manufacturer data from ${deviceId}: ${dataAscii}`);
  }
}

const sendManufacturerData = async (deviceId: string, {manufacturerData}: Advertisement): Promise<void> => {
  // First two bytes is the manufacturer code (little-endian) as per https://www.bluetooth.com/specifications/assigned-numbers/company-identifiers
  const {code, data} = parseManufacturerData(manufacturerData);

  await mqttClient.send(`${BLE_ADVERTISE}/${deviceId}/manufacturer/${code}`, data.toString('hex'));
  await sendEspruinoDataIfPresent(deviceId, code, data);
}

const sendServiceData = async (deviceId: string, {serviceData}: Advertisement): Promise<void> => {
  for (const {uuid, data} of serviceData) {
    await mqttClient.send(`${BLE_ADVERTISE}/${deviceId}/${uuid}`, data);

    const decodedAttributeData = decodeAttributeData(uuid, data);

    await sendObjectEntries(`${BLE_ADVERTISE}/${deviceId}`, decodedAttributeData);
  };
}

const onDiscovery = async (peripheral: Peripheral): Promise<void> => {
  if (config.onlyKnownDevices && !isKnownDevice(peripheral)) {
    return;
  }

  const deviceId = getDeviceId(peripheral);

  await sendPeripheralData(deviceId, peripheral);
  await sendManufacturerData(deviceId, peripheral.advertisement);
  await sendServiceData(deviceId, peripheral.advertisement);
}

const onScanStart = () => {
  log.info('BLE scanning started.');
}

const onScanStop = () => {
  log.info('BLE scanning stopped.');
}

export const start = (_config: Config, _mqttClient: MqttClient) => {
  config = _config;
  mqttClient = _mqttClient;

  noble.on('stateChange', onStateChange);
  noble.on('discover', onDiscovery);
  noble.on('scanStart', onScanStart);
  noble.on('scanStop', onScanStop);
};

export const stop = async () => {
  await mqttClient.disconnect();
};

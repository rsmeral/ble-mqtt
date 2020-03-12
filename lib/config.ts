import {promises as fs} from 'fs';
import Joi from '@hapi/joi';

import {logger} from './logger';
import {MqttOptions} from './mqtt';

var CONFIG_FILENAME = 'config.json';

const log = logger('Config');

let config: Config;

type MandatoryConfig = {
  /** MQTT broker url, including protocol */
  mqttBrokerUrl: string;
}

type OptionalConfig = {
  /** If the device is listed here, we use the human readable name when printing status and publishing on MQTT */
  knownDevices: Record<string, string>;

  /** Indicates whether discovery should only accept known devices */
  onlyKnownDevices: boolean;

  /** 
   * How many seconds to wait for a packet before considering BLE connection broken and exiting. 
   * Higher values are useful with slowly advertising sensors. Setting a value of 0 disables the exit/restart. 
   */
  bleTimeout: number;

  /** MQTT username and password */
  mqttOptions: Partial<MqttOptions>;
}

export type Config = MandatoryConfig & Partial<OptionalConfig>;

const configSchema = Joi.object<Config>({
  knownDevices: Joi.object().pattern(/^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/, Joi.string()),
  onlyKnownDevices: Joi.boolean(),
  bleTimeout: Joi.number(),
  mqttBrokerUrl: Joi.string().required(),
  mqttOptions: Joi.object<MqttOptions>().keys({
    username: Joi.string().required(),
    password: Joi.string()
  })
}).unknown(true);

const defaults: OptionalConfig = {
  knownDevices: {},
  onlyKnownDevices: false,
  bleTimeout: 10,
  mqttOptions: {}
};

const ensureFileExists = async (fileName: string): Promise<void> => {
  try {
    await fs.stat(fileName);
  } catch (e) {
    if (e.code === 'ENOENT') {
      log.error(`File '${fileName}' does not exist.`)
      throw new Error(`File '${fileName}' does not exist.`);
    }
  }
}

export const loadConfigFromFile = async (fileName = CONFIG_FILENAME): Promise<Config> => {
  await ensureFileExists(fileName);
  const json = await fs.readFile(fileName, 'utf-8');
  const configObject = JSON.parse(json);
  const {error, value} = configSchema.validate(configObject);

  if (error) {
    log.error(`Error while reading config:`);
    log.error(error.annotate());
    throw error;
  }

  config = Object.assign(defaults, value);
  log.debug(`Loaded config from ${fileName}`);
  return config;
}

export const getConfig = (): Config => {
  if (!config) {
    throw new Error('Config not loaded.');
  }

  return config;
}

export const getConfigValue = <P extends keyof Config>(key: P): Config[P] =>
  getConfig()[key];

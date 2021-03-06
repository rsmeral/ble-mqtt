/*
 * This file is part of ble-mqtt, a Bluetooth-MQTT bridge.
 *
 * Copyright (C)  2016 Gordon Williams <gw@pur3.co.uk>
 *                2020 Ron Smeral <ron@smeral.net>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {promises as fs} from 'fs';
import Joi from '@hapi/joi';

import {logger} from './logger';
import {MqttOptions} from './mqtt';

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

  /** MQTT username and password */
  mqttOptions: Partial<MqttOptions>;
}

export type Config = MandatoryConfig & Partial<OptionalConfig>;

const configSchema = Joi.object<Config>({
  knownDevices: Joi.object().pattern(/^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/, Joi.string()),
  onlyKnownDevices: Joi.boolean(),
  mqttBrokerUrl: Joi.string().required(),
  mqttOptions: Joi.object<MqttOptions>().keys({
    username: Joi.string().required(),
    password: Joi.string()
  })
}).unknown(true);

const defaults: OptionalConfig = {
  knownDevices: {},
  onlyKnownDevices: false,
  mqttOptions: {}
};

const ensureFileExists = async (fileName: string): Promise<void> => {
  try {
    await fs.stat(fileName);
  } catch (e) {
    if (e.code === 'ENOENT') {
      log.error(`File '${fileName}' does not exist.`);
      throw new Error(`File '${fileName}' does not exist.`);
    }
  }
};

export const loadConfigFromFile = async (fileName: string): Promise<Config> => {
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
};

export const getConfig = (): Config => {
  if (!config) {
    throw new Error('Config not loaded.');
  }

  return config;
};

export const getConfigValue = <P extends keyof Config>(key: P): Config[P] =>
  getConfig()[key];

#!/usr/bin/env node
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

import parseArgs from 'minimist';

import * as discovery from './lib/discovery';
import {loadConfigFromFile} from './lib/config';
import {connect, MqttClient} from './lib/mqtt';
import {logger} from './lib/logger';

export const DEFAULT_CONFIG_PATH = 'config.json';

const log = logger('Main');

let mqttClient: MqttClient;

const terminationHandler = async (): Promise<void> => {
  try {
    await discovery.stop();
    await mqttClient.disconnect();
    process.exit(0);
  } catch (e) {
    log.error(e.message);
    process.exit(1);
  }
};

const main = async (): Promise<void> => {
  const parsedArgs = parseArgs(process.argv.slice(2));
  const configFilePath = parsedArgs.c || DEFAULT_CONFIG_PATH;

  try {
    const config = await loadConfigFromFile(configFilePath);
    mqttClient = await connect(config.mqttBrokerUrl, config.mqttOptions);
    await discovery.start(config, mqttClient);

    process.on('SIGTERM', terminationHandler);
  } catch (e) {
    process.exit(1);
  }
};

main();

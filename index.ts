#!/usr/bin/env node

import parseArgs from 'minimist';

import * as discovery from './lib/discovery';
import {loadConfigFromFile} from './lib/config';
import {connect, MqttClient} from './lib/mqtt';
import {logger} from './lib/logger';

export const DEFAULT_CONFIG_PATH = 'config.json';

const log = logger('Main');

let mqttClient: MqttClient;

const terminationHandler = async () => {
  try {
    await discovery.stop();
    await mqttClient.disconnect();
    process.exit(0);
  } catch (e) {
    log.error(e.message);
    process.exit(1);
  }
}

const main = async () => {
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
}

main();

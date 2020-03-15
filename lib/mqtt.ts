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

import * as mqtt from 'async-mqtt';

import {logger} from './logger';

export type MqttOptions = {
  username: string;
  password: string;
}

const log = logger('MQTT');

let mqttClient: MqttClient;

export type MqttClient = {
  send: (topic: string, message: any) => Promise<void>,
  disconnect: () => Promise<void>
}

export const connect = async (brokerUrl: string, options?: Partial<MqttOptions>): Promise<MqttClient> => {
  const client = await mqtt.connectAsync(brokerUrl, options);

  client.on('error', (error) => {
    log.error(`Connection error: ${error}`);
    throw error;
  });

  client.on('connect', () => {
    log.info(`Connected to ${brokerUrl}`);
  });

  const send = async (topic: string, message: any): Promise<void> => {
    const msg = ['string', 'buffer'].includes(typeof message)
      ? message
      : JSON.stringify(message);
    await client.publish(topic, msg);
  }

  const disconnect = async (): Promise<void> => {
    await client.end();
    log.info('Disconnected.')
  }

  mqttClient = {
    send,
    disconnect
  }

  return mqttClient;
}

export const getMqttClient = (): MqttClient => {
  if (!mqttClient) {
    throw new Error('MQTT client not connected.');
  }

  return mqttClient;
}

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

  const disconnect = (): Promise<void> => client.end();

  mqttClient = {
    send,
    disconnect
  }

  return mqttClient;
}

export const getMqttClient = (): MqttClient => {
  if (!mqttClient) {
    throw new Error('MQTT client not connected');
  }

  return mqttClient;
}

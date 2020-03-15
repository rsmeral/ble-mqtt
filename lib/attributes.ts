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

const serviceNames: Record<string, string> = {
  '1809': 'Temperature',
  '180a': 'Device Information',
  '180f': 'Battery Percentage',
  '181c': 'User Data',
  'feaa': 'Eddystone',
  '2a6e': 'Temperature',
  '2a6f': 'Humidity',
  '2a6d': 'Pressure',
  '6e400001b5a3f393e0a9e50e24dcca9e': 'nus',
  '6e400002b5a3f393e0a9e50e24dcca9e': 'nus_tx',
  '6e400003b5a3f393e0a9e50e24dcca9e': 'nus_rx',
};

type ServiceDecoder = (data: Buffer) => object;

const serviceHandlers: Record<string, ServiceDecoder> = {
  // Temperature
  '1809': (data: Buffer) => {
    let temp = (data.length == 2)
      ? (((data[1] << 8) + data[0]) / 100)
      : data[0];

    if (temp >= 128) {
      temp -= 256;
    }

    return {
      temp
    };
  },

  // Battery percent
  '180f': (data: Buffer) => ({
    battery: data[0]
  }),

  // Eddystone
  'feaa': (data: Buffer) => {
    if (data[0] !== 0x10) {
      return;
    }

    let rssi = data[1];
    if (rssi & 128) {
      rssi -= 256; // signed number
    }

    const urlType = data[2];
    const URL_TYPES = [
      'http://www.',
      'https://www.',
      'http://',
      'https://'
    ];

    const urlPrefix = URL_TYPES[urlType] || '';
    const urlBody = data.slice(3, data.length).toString('ascii');
    const url = `${urlPrefix}${urlBody}`;

    return {
      url,
      'rssi@1m': rssi
    };

  },

  // Pressure in Pa
  '2a6d': (data: Buffer) => ({
    pressure: ((data[1] << 24) + (data[1] << 16) + (data[1] << 8) + data[0]) / 10
  }),

  // Temperature in C
  '2a6e': (data: Buffer) => {
    let temp = ((data[1] << 8) + data[0]) / 100;
    if (temp >= 128) {
      temp -= 256;
    }

    return {
      temp
    };
  },

  // Humidity
  '2a6f': (data: Buffer) => ({
    humidity: ((data[1] << 8) + data[0]) / 100
  })
};

export const getReadableAttributeName = (uuid: string): string =>
  serviceNames[uuid] || uuid;

export const decodeAttributeData = function (uuid: string, data: Buffer): object | Buffer {
  const decoder = serviceHandlers[uuid];

  return decoder
    ? decoder(data)
    : data;
};

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
/* eslint-disable @typescript-eslint/no-explicit-any */

type LogFunction = (message?: any, ...optionalParams: any[]) => void;

type Logger = {
  debug: LogFunction;
  info: LogFunction;
  error: LogFunction;
  warn: LogFunction;
};

const wrap = (namespace: string, logFunction: LogFunction): LogFunction =>
  (args: any[]): void => logFunction(`[${namespace}]`, args);

export const logger = (ns: string): Logger => ({
  debug: wrap(ns, console.debug),
  info: wrap(ns, console.info),
  error: wrap(ns, console.error),
  warn: wrap(ns, console.warn)
});

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

type LogFunction = (message?: any, ...optionalParams: any[]) => void;

const wrap = (namespace: string, logFunction: LogFunction): LogFunction =>
  (args: any[]) => logFunction(`[${namespace}]`, args);

export const logger = (ns: string) => ({
  debug: wrap(ns, console.debug),
  info: wrap(ns, console.info),
  error: wrap(ns, console.error),
  warn: wrap(ns, console.warn)
});

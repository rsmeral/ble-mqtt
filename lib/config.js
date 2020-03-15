/*
 * This file is part of EspruinoHub, a Bluetooth-MQTT bridge for
 * Puck.js/Espruino JavaScript Microcontrollers
 *
 * Copyright (C) 2016 Gordon Williams <gw@pur3.co.uk>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * ----------------------------------------------------------------------------
 *  Configuration file handling
 * ----------------------------------------------------------------------------
 */

var CONFIG_FILENAME = "config.json";

/** If the device is listed here, we use the human readable name
when printing status and publishing on MQTT */
export const known_devices = {};

/** list of services that can be decoded */
export const advertised_services = {};

/** switch indicating whether discovery should only accept known devices */
export const only_known_devices = false;

/* How many seconds to wait for a packet before considering BLE connection
broken and exiting. Higher values are useful with slowly advertising sensors.
Setting a value of 0 disables the exit/restart. */
export const ble_timeout = 10;

function log(x) {
  console.log("<Config> " + x);
}

/// Load configuration
exports.init = function () {
  var fs = require("fs");
  if (fs.existsSync(CONFIG_FILENAME)) {
    var f = fs.readFileSync(CONFIG_FILENAME).toString();
    var json = {};
    try {
      json = JSON.parse(f);
    } catch (e) {
      log("Error parsing " + CONFIG_FILENAME + ": " + e);
      return;
    }
    // Load settings
    if (json.known_devices) {
      Object.keys(json.known_devices).forEach(function (k) {
        exports.known_devices[k.toString().toLowerCase()] = json.known_devices[k];
      });
    }
    if (json.only_known_devices)
      exports.only_known_devices = json.only_known_devices;
    if (json.ble_timeout)
      exports.ble_timeout = json.ble_timeout;
    exports.mqtt_host = json.mqtt_host ? json.mqtt_host : 'mqtt://localhost';
    exports.mqtt_options = json.mqtt_options ? json.mqtt_options : {};
    if (json.advertised_services)
      exports.advertised_services = json.advertised_services;
    log("Config loaded");
  } else {
    log("No " + CONFIG_FILENAME + " found");
  }
};

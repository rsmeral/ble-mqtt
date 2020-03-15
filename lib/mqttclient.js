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
 *  Handling the MQTT connection
 * ----------------------------------------------------------------------------
 */

var mqtt = require('mqtt');
var config = require('./config');

function log(x) {
  console.log("<MQTT> " + x);
}

log("Connecting...");
var client;
try {client = mqtt.connect(config.mqtt_host, config.mqtt_options);}
catch (e) {client = mqtt.connect('mqtt://' + config.mqtt_host);}

var connected = false;
var connectTimer = setTimeout(function () {
  connectTimer = undefined;
  log("NOT CONNECTED AFTER 10 SECONDS");
}, 10000);

client.on('error', function (error) {
  log("Connection error:" + error);
});
client.on('connect', function () {
  if (connectTimer) clearTimeout(connectTimer);
  log("Connected");
  connected = true;
});

exports.client = client;

exports.send = function (topic, message) {
  if (connected) client.publish(topic, message);
};
FROM node:lts-alpine

MAINTAINER Ron Smeral

USER root

# Install dependencies
RUN apk add git bluez python build-base linux-headers
	
RUN git clone https://github.com/rsmeral/ble-mqtt /opt/ble-mqtt
WORKDIR /opt/ble-mqtt
RUN yarn
RUN yarn build

# Clean up
RUN apk del git python build-base linux-headers && \
    rm -rf /tmp/*

CMD node build/index.js -c /etc/ble-mqtt/config.json

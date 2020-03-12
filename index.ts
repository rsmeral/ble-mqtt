import * as discovery from './lib/discovery';
import {loadConfigFromFile} from './lib/config';
import {connect} from './lib/mqtt';

const main = async () => {
  try {
    const config = await loadConfigFromFile();
    const mqttClient = await connect(config.mqttBrokerUrl, config.mqttOptions);
    discovery.start(config, mqttClient);
  } catch (e) {
    process.exit(1);
  }
}

main();

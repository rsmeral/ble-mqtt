import * as discovery from './lib/discovery';
import {loadConfigFromFile} from './lib/config';
import {connect} from './lib/mqtt';
import parseArgs from 'minimist';

export const DEFAULT_CONFIG_PATH = 'config.json';

const main = async () => {
  const parsedArgs = parseArgs(process.argv.slice(2));
  const configFilePath = parsedArgs.c || DEFAULT_CONFIG_PATH;

  try {
    const config = await loadConfigFromFile(configFilePath);
    const mqttClient = await connect(config.mqttBrokerUrl, config.mqttOptions);
    discovery.start(config, mqttClient);
  } catch (e) {
    process.exit(1);
  }
}

main();

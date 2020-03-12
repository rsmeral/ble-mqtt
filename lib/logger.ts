type LogFunction = (message?: any, ...optionalParams: any[]) => void;

const wrap = (namespace: string, logFunction: LogFunction): LogFunction =>
  (args: any[]) => logFunction(`[${namespace}] `, args);

export const logger = (ns: string) => ({
  debug: wrap(ns, console.debug),
  info: wrap(ns, console.info),
  error: wrap(ns, console.error),
  warn: wrap(ns, console.warn)
});

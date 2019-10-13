const winston = require('winston');

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
  const cleanedMessage = message.replace('"', '\\"');

  return `time="${timestamp}" level="${level}" msg="${cleanedMessage}"`;
});

const getLogLevelForEnvironment = env => {
  switch (env) {
    case 'development':
      return 'debug';
    case 'test':
      return 'emerg';
    default:
      return 'info';
  }
};

const logger = winston.createLogger({
  level: getLogLevelForEnvironment(process.env['NODE_ENV']),
  format: winston.format.combine(winston.format.timestamp(), myFormat),
  transports: [new winston.transports.Console()],
});
module.exports.logger = logger;

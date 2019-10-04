const { get } = require('./config');
const { logger } = require('./logger');
const redis = require('./redis');

const app = require('./app.js');

const server = app.listen(get('port'), () =>
  logger.info(`secureCodeBox listening on port ${get('port')}!`)
);

process.on('SIGTERM', () => {
  logger.warn('Recieved "SIGTERM" Signal shutting down.');
  server.close();
  redis.disconnect();
  process.exit(0);
});

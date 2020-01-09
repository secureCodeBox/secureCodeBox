const { get } = require('./config');
const { logger } = require('./logger');

const app = require('./app.js');

const stop = require('./jobPolling');

const server = app.listen(get('port'), () =>
  logger.info(`secureCodeBox listening on port ${get('port')}!`)
);

process.on('SIGTERM', () => {
  logger.warn('Recieved "SIGTERM" Signal shutting down.');
  server.close();
  stop();
  process.exit(0);
});

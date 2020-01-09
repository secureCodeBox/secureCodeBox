const express = require('express');

const app = express();

const { get } = require('./config');
const { logger } = require('./logger');

const { completeScan } = require('./scanWaitingArea');

app.use(
  express.json({
    limit: '10mb',
  })
);

app.post('/api/v1alpha/scan-job/:scanId/persist', async (req, res) => {
  const { scanId } = req.params;
  const { findings, tenant = 'default' } = req.body;

  logger.info(`Persisting result for scan "${scanId}"`);

  completeScan({ id: scanId, findings });

  return res.status(204).send();
});

module.exports = app;

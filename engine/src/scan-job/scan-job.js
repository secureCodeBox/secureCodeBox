const express = require('express');

const { get } = require('../config');
const {
  lookForJob,
  createScanJob,
  getScanJob,
  addEventToScanJob,
} = require('../queue');
const minio = require('../minio');
const { logger } = require('../logger');
const path = require('path');
const axios = require('axios');

const router = express.Router();

router.post('/api/v1alpha/scan-job/lock', async (req, res) => {
  const { jobTypes, dispatcherEnvironmentName } = req.body;

  for (const jobType of jobTypes) {
    const job = await lookForJob(jobType, 'default', dispatcherEnvironmentName);

    if (job) {
      return res.json({ jobType: jobType, ...job });
    }
  }

  return res.status(204).send();
});

router.post(
  '/api/v1alpha/scan-job/:scanId/scan-completion',
  async (req, res) => {
    const { scanId } = req.params;
    const { files } = req.body;

    logger.info(`Adding ScanCompleted Event to scanjob "job:${scanId}"`);
    await addEventToScanJob(scanId, {
      type: 'ScanCompleted',
      attributes: {
        files,
      },
    });

    for (const { fileName, resultType } of files) {
      logger.debug(`Creating presigned url to access result file in parser.`);
      const basename = path.basename(fileName);
      const url = await minio.presignedUrl(
        'GET',
        get('s3.bucket'),
        `scan-${scanId}/${basename}`,
        1000 * 60,
        {}
      );
      logger.debug(`Presigned access url: ${url}`);

      await createScanJob(`parse:${resultType}`, 'default', [url, scanId]);
    }

    return res.status(204).send();
  }
);

router.post('/api/v1alpha/scan-job/:scanId/findings', async (req, res) => {
  const { scanId } = req.params;
  const { findings } = req.body;

  logger.debug(
    `Got ${findings.length} from parser for security test: "${scanId}".`
  );
  
  const severityOverview = findings.reduce((overview, { severity }) => {
    if (Object.prototype.hasOwnProperty.call(overview, severity)) {
      overview[severity] = overview[severity] + 1;
    } else {
      overview[severity] = 1;
    }
    return overview;
  }, {});
  const categoryOverview = findings.reduce((overview, { category }) => {
    if (Object.prototype.hasOwnProperty.call(overview, category)) {
      overview[category] = overview[category] + 1;
    } else {
      overview[category] = 1;  
    }
    return overview;
  }, {});

  console.log({
    severityOverview,
    categoryOverview,
  });

  await addEventToScanJob(scanId, {
    type: 'ResultsParsed',
    attributes: {
      findingCount: findings.length,
      severityOverview,
      categoryOverview,
    },
  });

  // persistence provider
  try {
    await axios.post(
      `http://persistence-elastic:3000/api/v1alpha/scan-job/${scanId}/persist`,
      { findings }
    );
  } catch (error) {
    logger.error(`Persistence provider errored: ${error.message}`);
    logger.debug(error);
  }

  return res.status(204).send();
});

router.get('/api/v1alpha/scan-job/:scanId', async (req, res) => {
  const { scanId } = req.params;

  const scanJob = await getScanJob(scanId);

  if (scanJob) {
    return res.json(scanJob);
  } else {
    return res.status(404).send();
  }
});

router.put('/api/v1alpha/scan-job/', async (req, res) => {
  const { jobType, tenant = 'default', parameters } = req.body;

  const scanId = await createScanJob(jobType, tenant, parameters);

  return res.status(201).json({ id: scanId, message: 'ScanJob created' });
});

router.post(
  '/api/v1alpha/scan-job/request-file-upload-urls',
  async (req, res) => {
    const { scanId, requestedFileDefinition } = req.body;

    logger.debug(
      `Signing file upload url for file ${requestedFileDefinition.fileName}`
    );

    try {
      const url = await minio.presignedUrl(
        'PUT',
        get('s3.bucket'),
        `scan-${scanId}/${requestedFileDefinition.fileName}`,
        1000 * 60,
        {}
      );

      res.send(url);
    } catch (error) {
      logger.error(
        `Failed to generated pre signed url for file ${requestedFileDefinition.fileName}`
      );
      logger.error(error);
      res.status(500).send('Failed to generated pre signed url');
    }
  }
);

module.exports = router;

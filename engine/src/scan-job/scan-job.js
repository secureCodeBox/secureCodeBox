const express = require('express');

const { get } = require('../config');
const { lookForJob, createScanJob } = require('../queue');
const minio = require('../minio');
const { logger } = require('../logger');

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

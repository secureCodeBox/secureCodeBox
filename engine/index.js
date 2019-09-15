const express = require('express');
const app = express();
const port = 3000;

const bodyParser = require('body-parser');

const { lookForJob, createScanJob } = require('./queue');

const Minio = require('minio');
const minioClient = new Minio.Client({
  endPoint: process.env['S3_ENDPOINT'],
  useSSL: process.env['S3_TLS_ENABLED'] === 'true',
  port: parseInt(process.env['S3_PORT'] || 443, 10),
  accessKey: process.env['S3_ACCESS_KEY'],
  secretKey: process.env['S3_SECRET_KEY'],
});

app.use(bodyParser.json());

app.post('/api/v1alpha/scan-job/lock', async (req, res) => {
  const { jobTypes } = req.body;

  for (const jobType of jobTypes) {
    const job = await lookForJob(jobType, 'default');

    if (job) {
      return res.json({ jobType: jobType, ...job });
    }
  }

  return res.status(204).send();
});

app.put('/api/v1alpha/scan-job/', async (req, res) => {
  const { jobType, tenant = 'default', parameters } = req.body;

  const scanId = await createScanJob(jobType, tenant, parameters);

  return res.status(201).json({ id: scanId, message: 'ScanJob created' });
});

app.post('/api/v1alpha/scan-job/request-file-upload-urls', async (req, res) => {
  const { scanId, requestedFileDefinition } = req.body;

  console.log(
    `Signing file upload url for file ${requestedFileDefinition.fileName}`
  );

  try {
    const url = await minioClient.presignedUrl(
      'PUT',
      process.env['S3_BUCKET'],
      `scan-${scanId}/${requestedFileDefinition.fileName}`,
      1000 * 60,
      {}
    );

    res.send(url);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to generated presigned url');
  }
});

const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);

process.on('SIGTERM', () => {
  console.warn('Received "SIGTERM" Signal shutting down.');
  server.close();
  process.exit(0);
});

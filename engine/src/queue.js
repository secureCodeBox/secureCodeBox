const redis = require('./redis');
const uuid = require('uuid/v4');

async function lookForJob(jobType, tenant, dispatcherEnvironmentName) {
  const scanId = await redis.lpop(`${tenant}:${jobType}`);

  if (scanId) {
    const scanJob = await addEventToScanJob(scanId, {
      type: 'Locked',
      attributes: {
        dispatcherEnvironmentName,
      },
    });

    return scanJob;
  }

  return null;
}
module.exports.lookForJob = lookForJob;

async function addEventToScanJob(scanJobId, event) {
  const scanJob = JSON.parse(await redis.get(`job:${scanJobId}`));

  const updatedScanJob = {
    ...scanJob,
    events: [event, ...scanJob.events],
  };

  await redis.set(`job:${scanJobId}`, JSON.stringify(updatedScanJob));

  return updatedScanJob;
}
module.exports.addEventToScanJob = addEventToScanJob;

async function createScanJob(jobType, tenant, parameters) {
  const id = uuid();
  await redis.lpush(`${tenant}:${jobType}`, id);
  await redis.set(
    `job:${id}`,
    JSON.stringify({ id, parameters, createdAt: new Date(), events: [] })
  );

  return id;
}
module.exports.createScanJob = createScanJob;

async function getScanJob(scanId) {
  const scanJob = await redis.get(`job:${scanId}`);
  if (!scanJob) {
    return null;
  }
  return JSON.parse(scanJob);
}
module.exports.getScanJob = getScanJob;

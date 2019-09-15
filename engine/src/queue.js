const redis = require('./redis');
const uuid = require('uuid/v4');

async function lookForJob(jobType, tenant) {
  const res = await redis.lpop(`${tenant}:${jobType}`);

  return JSON.parse(res);
}
module.exports.lookForJob = lookForJob;

async function createScanJob(jobType, tenant, parameters) {
  const id = uuid();
  await redis.lpush(
    `${tenant}:${jobType}`,
    JSON.stringify({ id, parameters, createdAt: new Date() })
  );

  return id;
}
module.exports.createScanJob = createScanJob;

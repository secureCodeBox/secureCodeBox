const Redis = require('ioredis');
const uuid = require('uuid/v4');

const redis = new Redis({
  host: process.env['REDIS_HOST'] || '127.0.0.1',
  port: 6379,
  password: process.env['REDIS_PASSWORD'] || undefined,
});

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

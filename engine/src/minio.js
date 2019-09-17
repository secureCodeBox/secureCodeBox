const Minio = require('minio');

const { get } = require('./config');

module.exports = new Minio.Client({
  endPoint: get('s3.endpoint'),
  useSSL: get('s3.tls_enabled') === 'true',
  port: parseInt(get('s3.port'), 10),
  accessKey: get('s3.access_key'),
  secretKey: get('s3.secret_key'),
});

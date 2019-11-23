const config = require('../config/config.json');
const lodashGet = require('lodash.get');
const memoize = require('lodash.memoize');

const fetchConfigValue = name => {
  const envVarName = name
    .split('.')
    .map(string => string.toUpperCase())
    .join('_');

  return process.env[envVarName] || lodashGet(config, name);
};

const get = memoize(fetchConfigValue);
module.exports.get = get;

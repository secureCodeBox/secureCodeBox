const { logger } = require('../logger');
const axios = require('axios');
const getPersistenceProviderCache = require('./persistence-provider-cache-k8s');

const namespace = process.env['NAMESPACE'];

let persistenceProviderCache = null;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function persist(securityTestId, findings) {
  try {
    if (persistenceProviderCache === null) {
      persistenceProviderCache = getPersistenceProviderCache();

      // Give the cache a second to warm up
      await sleep(1000);
    }

    const persistenceProviders = persistenceProviderCache.list(namespace);

    if (!persistenceProviders) {
      logger.warn(
        `Failed to list Persistenceproviders. Is the PersistenceProvider custom resource installed?`
      );
      return;
    } else if (persistenceProviders.length === 0) {
      logger.warn(
        'No Structured PersistenceProviders configured! Findings will not be persisted.'
      );
      return;
    }

    for (const { metadata, spec } of persistenceProviders) {
      try {
        logger.info(`Persisting findings to ${metadata.name}.`);
        await axios.post(
          `${spec.address}/api/v1alpha/scan-job/${securityTestId}/persist`,
          { findings }
        );
      } catch (error) {
        logger.error(
          `Persistence ${metadata.name} provider errored: ${error.message}`
        );
        logger.debug(error);
      }
    }
  } catch (error) {
    logger.error('Failed to list persistence providers');
    logger.error(error.message);
  }
}

module.exports = persist;

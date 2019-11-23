const SecureCodeBoxScannerScaffolding = require('@securecodebox/scanner-scaffolding');
const { get } = require('./config');

const { waitForScan } = require('./scanWaitingArea');

const legacyEngineAddress = get('legacyengine.address');
const engineAddress = get('newengine.address');

const axios = require('axios');
const uuid = require('uuid/v4');

async function startSecurityTest({ scannerName, scannerParameters, tenant }) {
  try {
    const { data } = await axios.put(`${engineAddress}/api/v1alpha/scan-job/`, {
      jobType: scannerName,
      parameters: scannerParameters,
      tenant,
    });

    return data.id;
  } catch (error) {
    if (error.isAxiosError) {
      console.warn('Failed to contact the engine. Is it up?');
    } else {
      console.warn('Unknown error');
    }
  }
}

const nmapWorker = new SecureCodeBoxScannerScaffolding(
  async (targets, { id: legacyId }) => {
    const [target, ...discardedTargets] = targets;

    const nmapCmd = `${target.attributes.NMAP_PARAMETER || ''} ${
      target.location
    }`;
    console.log(`Starting Nmap Scan with args: "${nmapCmd}"`);

    const newId = await startSecurityTest({ scannerName: 'nmap', nmapCmd });

    console.log(`Mapping "${legacyId}" => "${newId}"`);

    const { findings } = await waitForScan({ legacyId, newId });

    return { raw: [], result: findings.map(f => ({ id: uuid(), ...f })) };
  },
  {
    topic: 'nmap_portscan',
    workername: 'faasy-nmap',
    engineAddress: legacyEngineAddress,
  }
);

function stop() {
  nmapWorker.stop();
}

module.exports = stop;

const {
  KubeConfig,
  Watch,
  ListWatch,
  CustomObjectsApi,
  BatchV1Api,
} = require('@kubernetes/client-node');
const axios = require('axios');
const get = require('lodash.get');
const isArray = require('lodash.isarray');
const flatmap = require('lodash.flatmap');
const path = require('path');

const dispatcherEnvironmentName = process.env['DISPATCHER_ENVIRONMENT_NAME'];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const engineUrl = process.env['ENGINE_ADDRESS'];

let scanJobCache;
let parseJobCache;
let batchClient;

async function main() {
  try {
    const kc = new KubeConfig();
    kc.loadFromCluster();
    const client = kc.makeApiClient(CustomObjectsApi);
    batchClient = kc.makeApiClient(BatchV1Api);

    const scanJobPath =
      '/api/experimental.securecodebox.io/v1/namespaces/default/scanjobdefinitions';
    const scanJobWatch = new Watch(kc);
    const scanJobListFn = () =>
      client.listNamespacedCustomObject(
        'experimental.securecodebox.io',
        'v1',
        'default',
        'scanjobdefinitions'
      );
    scanJobCache = new ListWatch(scanJobPath, scanJobWatch, scanJobListFn);

    const parsePath =
      '/api/experimental.securecodebox.io/v1/namespaces/default/parsejobdefinitions';
    const parseWatch = new Watch(kc);
    const parseListFn = () =>
      client.listNamespacedCustomObject(
        'experimental.securecodebox.io',
        'v1',
        'default',
        'parsejobdefinitions'
      );
    parseJobCache = new ListWatch(parsePath, parseWatch, parseListFn);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  while (true) {
    await sleep(1 * 1000);

    const scanJobList = scanJobCache.list('default');
    if (!scanJobList) {
      console.warn("List isn't set");
      continue;
    }
    const parseJobTypes = parseJobCache.list('default');
    if (!parseJobTypes) {
      console.warn("Parser List isn't set");
      continue;
    }

    const jobTypes = [
      ...scanJobList.map(scanJob => scanJob.metadata.name),
      ...parseJobTypes.map(
        parseDefinition => `parse:${parseDefinition.spec.handlesResultsType}`
      ),
    ];

    if (jobTypes.length === 0) {
      console.warn('No ScanJob or ParseJob configured to run');
      continue;
    }

    console.log(`Looking for Jobs of Types: [${jobTypes.join(',')}]`);

    const { status, data } = await axios
      .post(`${engineUrl}/api/v1alpha/scan-job/lock`, {
        jobTypes,
        dispatcherEnvironmentName,
      })
      .catch(err => {
        console.error('Request Failed');
        console.error(err);
      });

    if (status === 204) {
      console.log('No Job available');
      continue;
    } else if (status !== 200) {
      console.error(`Unknown error type from engine: "${status}"`);
      continue;
    }

    const jobId = data.id;
    const jobType = data.jobType;
    const jobParameters = data.parameters;

    if (jobType.startsWith('parse:')) {
      console.log(`starting hypothetical parse job: ${jobType}`);
      await startParseJob({ type: jobType, jobId, jobParameters, engineAddress: engineUrl });
    } else {
      console.info(`Starting Job:`);
      await startScanJob({ type: jobType, jobId, jobParameters, engineAddress: engineUrl });
    }
  }
}

async function startParseJob({ type, jobId, jobParameters, engineAddress }) {
  const parseJobName = type.split(':')[1];
  console.log(`Getting ParseJob definition ${parseJobName}`);
  const parseJobDefinition = parseJobCache.get(parseJobName, 'default');

  const jobDefinitionName = parseJobDefinition.metadata.name;
  const jobImage = parseJobDefinition.spec.image;

  const params = isArray(jobParameters) ? jobParameters : [jobParameters];

  console.log(`Starting parse job image (${jobImage}) with params ${params}`);

  const job = {
    metadata: {
      name: `${jobDefinitionName}-${jobId}`,
      labels: {
        id: jobId,
        type: 'parse-job',
      },
    },
    spec: {
      ttlSecondsAfterFinished: 10,
      template: {
        metadata: {
          labels: {
            id: jobId,
            type: 'scan-job',
          },
        },
        spec: {
          restartPolicy: 'OnFailure',
          containers: [
            {
              image: jobImage,
              name: jobDefinitionName,
              args: [...params, engineAddress],
            },
          ],
        },
      },
    },
  };

  await batchClient
    .createNamespacedJob('default', job)
    .then(res => {
      console.log(`Parse Job started successfully`);
    })
    .catch(error => console.error(error.response.body));
}

async function startScanJob({ type, jobId, jobParameters, engineAddress }) {
  const scanJobDefinition = scanJobCache.get(type, 'default');

  const jobDefinitionName = scanJobDefinition.metadata.name;
  const jobDefinition = scanJobDefinition.spec.jobTemplate;

  const image = jobDefinition.spec.template.spec.containers[0].image;
  const command = jobDefinition.spec.template.spec.containers[0].command;

  const params = isArray(jobParameters) ? jobParameters : [jobParameters];

  console.log(
    `Starting job image (${image}) with commands: [${jobDefinition.spec.template.spec.containers[0].command.join(
      ','
    )}]`
  );

  const job = {
    metadata: {
      // Allow users to specify non standard metadata
      // Standard fields like name will be overridden
      ...get(jobDefinition, 'metadata', {}),
      name: `${type}-${jobId}`,
      labels: {
        // Allow users to specify non standard labels
        // Standard labels like id and type will be overridden
        ...get(jobDefinition, ['metadata', 'labels'], {}),
        id: jobId,
        type: 'scan-job',
        scannerType: scanJobDefinition.metadata.name,
      },
    },
    spec: {
      ...get(jobDefinition, ['spec']),
      template: {
        ...get(jobDefinition, ['spec', 'template']),
        metadata: {
          ...get(jobDefinition, ['spec', 'template', 'metadata']),
          labels: {
            ...get(jobDefinition, ['spec', 'template', 'metadata', 'labels']),
            id: jobId,
            type: 'scan-job',
          },
        },
        spec: {
          ...jobDefinition.spec.template.spec,
          serviceAccountName: 'lurcher',
          containers: [
            {
              ...jobDefinition.spec.template.spec.containers[0],
              command: [...command, ...params],
              volumeMounts: [
                ...get(
                  jobDefinition,
                  ['spec', 'template', 'spec', 'containers[0]', 'volumeMounts'],
                  []
                ),
                {
                  name: 'scan-results',
                  mountPath: '/home/securecodebox/',
                },
              ],
            },
            ...jobDefinition.spec.template.spec.containers.slice(1),
            {
              name: 'lurcher',
              image: 'scbexperimental/lurcher',
              args: await getLurcherArgs(
                jobId,
                jobDefinitionName,
                scanJobDefinition.spec.extractResults,
                engineAddress
              ),
              volumeMounts: [
                {
                  name: 'scan-results',
                  mountPath: '/home/securecodebox/',
                  readOnly: true,
                },
              ],
            },
          ],
          volumes: [
            ...get(jobDefinition, ['spec', 'template', 'spec', 'volumes'], []),
            {
              name: 'scan-results',
              emptyDir: {},
            },
          ],
        },
      },
    },
  };

  await batchClient
    .createNamespacedJob('default', job)
    .then(res => {
      console.log(`Job started successfully`);
      // console.log(res.body);
    })
    .catch(error => console.error(error.response.body));
}

async function getLurcherArgs(
  scanId,
  scannerName,
  resultExtractionDefinitions,
  engineAddress
) {
  const extractionPayloads = await Promise.all(
    resultExtractionDefinitions.map(async resultExtractionDefinition => {
      const fileName = path.basename(resultExtractionDefinition.location);

      console.log(`Fetching file upload url for file ${fileName}`);

      const { data: presignedUrl } = await axios.post(
        `${engineUrl}/api/v1alpha/scan-job/request-file-upload-urls`,
        {
          scanId,
          requestedFileDefinition: {
            fileName,
          },
        }
      );

      console.log(`Got file upload url for file ${fileName}`);

      return {
        ...resultExtractionDefinition,
        presignedUrl,
      };
    })
  );

  const fileArgs = flatmap(
    extractionPayloads,
    ({ location, type: resultType, presignedUrl }) => {
      return ['--file', [location, resultType, presignedUrl].join(',')];
    }
  );

  const args = [
    '--scan-id',
    scanId,
    '--main-container-name',
    scannerName,
    '--engine-address',
    engineAddress,
    ...fileArgs,
  ];

  console.log('lurcher args');
  console.log(args);

  return args;
}

try {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}

process.on('SIGTERM', () => {
  console.warn('Received "SIGTERM" Signal shutting down.');
  process.exit(0);
});

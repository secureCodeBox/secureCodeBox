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

async function main() {
  const kc = new KubeConfig();

  kc.loadFromCluster();
  // kc.loadFromDefault();

  const path =
    '/api/experimental.securecodebox.io/v1/namespaces/default/scanjobdefinitions';
  const watch = new Watch(kc);
  const client = kc.makeApiClient(CustomObjectsApi);
  const batchClient = kc.makeApiClient(BatchV1Api);

  const listFn = () =>
    client.listNamespacedCustomObject(
      'experimental.securecodebox.io',
      'v1',
      'default',
      'scanjobdefinitions'
    );

  const cache = new ListWatch(path, watch, listFn);

  while (true) {
    await sleep(1 * 1000);

    const list = cache.list('default');
    if (!list) {
      console.warn("List isn't set");
      continue;
    }
    if (list.length === 0) {
      console.warn('List is empty');
      continue;
    }

    const jobTypes = list.map(scanJob => scanJob.spec.name);

    console.log(`Looking for Jobs of Types: [${jobTypes.join(',')}]`);

    const res = await axios
      .post(`${engineUrl}/api/v1alpha/scan-job/lock`, {
        jobTypes,
        dispatcherEnvironmentName,
      })
      .catch(err => {
        console.error('Request Failed');
        console.error(err);
      });

    if (res.status === 204) {
      console.log('No Job available');
      continue;
    } else if (res.status !== 200) {
      console.error(`Unknown error type: "${res.status}"`);
      continue;
    }

    console.info(`Starting Job:`);

    const type = res.data.jobType;
    const jobId = res.data.id;

    const scanJobDefinition = cache.get(type, 'default');

    const jobDefinitionName = scanJobDefinition.spec.name;
    const jobDefinition = scanJobDefinition.spec.jobTemplate;

    const image = jobDefinition.spec.template.spec.containers[0].image;
    const command = jobDefinition.spec.template.spec.containers[0].command;

    const params = isArray(res.data.parameters)
      ? res.data.parameters
      : [res.data.parameters];

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
          scannerType: scanJobDefinition.spec.name,
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
                    [
                      'spec',
                      'template',
                      'spec',
                      'containers[0]',
                      'volumeMounts',
                    ],
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
                  scanJobDefinition.spec.extractResults
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
              ...get(
                jobDefinition,
                ['spec', 'template', 'spec', 'volumes'],
                []
              ),
              {
                name: 'scan-results',
                emptyDir: {},
              },
            ],
          },
        },
      },
    };

    // console.log('Job to create:');
    // console.log(JSON.stringify(job, undefined, 2));

    await batchClient
      .createNamespacedJob('default', job)
      .then(res => {
        console.log(`Job started successfully`);
        // console.log(res.body);
      })
      .catch(error => console.error(error.response.body));
  }
}

async function getLurcherArgs(
  scanId,
  scannerName,
  resultExtractionDefinitions
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
    ({ location, contentType, presignedUrl }) => {
      return ['--file', [location, contentType, presignedUrl].join(',')];
    }
  );

  const args = ['--main-container-name', scannerName, ...fileArgs];

  console.log('lurcher args');
  console.log(args);

  return ['--main-container-name', scannerName, ...fileArgs];
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}

process.on('SIGTERM', () => {
  console.warn('Received "SIGTERM" Signal shutting down.');
  process.exit(0);
});

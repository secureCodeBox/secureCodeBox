const { KubeConfig, CoreV1Api } = require('@kubernetes/client-node');
const fs = require('fs');
const arg = require('arg');
const request = require('request');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const {
    '--file': filesToExtractRaw = [],
    '--skip-k8s': skipK8s = false,
    '--scan-id': scanId,
    '--main-container-name': mainContainerName,
  } = arg({
    '--file': [String],
    '--scan-id': String,
    '--main-container-name': String,
    '--skip-k8s': Boolean,
  });

  const filesToExtract = filesToExtractRaw.map(fileDefinition => {
    // files are passed in in the following scheme:
    // --file=file-name.xml,application/xml,https://s3-presigned-upload-url-...
    const [fileName, contentType, uploadUrl] = fileDefinition.split(',');
    return { fileName, contentType, uploadUrl };
  });

  console.log('Lurcher is starting up.');
  console.log(
    'Once the scan is done, the following files are to be extracted.'
  );
  for ({ fileName, contentType } of filesToExtract) {
    console.log(` - ${fileName} (${contentType})`);
  }

  const podname = process.env['HOSTNAME'];

  if (!skipK8s) {
    const kc = new KubeConfig();
    kc.loadFromCluster();
    const client = kc.makeApiClient(CoreV1Api);

    while (true) {
      console.log(
        `Waiting for main scan container (${mainContainerName}) to exit...`
      );
      try {
        await sleep(500);

        const response = await client.readNamespacedPod(podname, 'default');

        const mainContainerStatus = response.body.status.containerStatuses.filter(
          containerStatus => containerStatus.name === mainContainerName
        )[0];
        mainContainerState = mainContainerStatus.state.terminated;
        if (mainContainerState !== undefined) {
          break;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log(`Container Terminated`);

  console.log(`Uploading result files`);

  let files = [];

  for ({ fileName, uploadUrl, contentType } of filesToExtract) {
    try {
      const { statusCode, uploadSize, uploadDuration } = await uploadFile(
        fileName,
        uploadUrl,
        contentType
      );

      console.log(
        ` - ${fileName} (${uploadSize}bytes) uploaded in ${uploadDuration}ms`
      );

      files.push({ fileName, uploadSize });
    } catch (error) {
      console.error(`Failed to upload File: ${fileName}`);

      console.error(error.request.headers);
      // console.error(error);
    }
  }

  try {
    const res = await request.post({
      url: `http://engine.default.svc.cluster.local:3000/api/v1alpha/scan-job/${scanId}/scan-completion`,
      json: {
        files,
      },
    });
  } catch (error) {
    console.error(`Failed mark scan as completed with the engine`);
  }
}

function uploadFile(fileName, uploadUrl, contentType) {
  return new Promise(async (resolve, reject) => {
    const fileSize = await getFileSize(fileName);

    const startTime = new Date();

    fs.createReadStream(fileName)
      .pipe(
        request.put(uploadUrl, {
          headers: {
            'content-length': fileSize,
          },
        })
      )
      .on('response', response => {
        if (response.statusCode < 400) {
          const endTime = new Date();

          const uploadDuration = endTime.getTime() - startTime.getTime();
          resolve({
            statusCode: response.statusCode,
            uploadSize: fileSize,
            uploadDuration,
          });
        } else {
          console.log(`Request failed with status: ${response.statusCode}`);
          reject(response);
        }
      })
      .on('error', reject);
  });
}

function getFileSize(fileName) {
  return new Promise((resolve, reject) => {
    fs.stat(fileName, (err, stat) => {
      if (err) {
        reject(
          new Error(`Could not read file size of file: "${fileName}"`, error)
        );
      }
      resolve(stat.size);
    });
  });
}

main();

process.on('SIGTERM', () => {
  console.warn('Received "SIGTERM" Signal shutting down.');
  process.exit(0);
});

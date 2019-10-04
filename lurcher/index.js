const { KubeConfig, CoreV1Api } = require('@kubernetes/client-node');
const fs = require('fs');
const arg = require('arg');
const request = require('request');
const path = require('path');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const {
    '--file': filesToExtractRaw = [],
    '--skip-k8s': skipK8s = false,
    '--scan-id': scanId,
    '--main-container-name': mainContainerName,
    '--engine-address': engineAddress,
  } = arg({
    '--file': [String],
    '--scan-id': String,
    '--main-container-name': String,
    '--skip-k8s': Boolean,
    '--engine-address': String,
  });

  const filesToExtract = filesToExtractRaw.map(fileDefinition => {
    // files are passed in in the following scheme:
    // --file=file-name.xml,application/xml,https://s3-presigned-upload-url-...
    const [fileName, resultType, uploadUrl] = fileDefinition.split(',');

    if(path.parse(fileName).dir !== '/home/securecodebox'){
      throw new Error(`Directories outside "/home/securecodebox" are currently not supported for file extraction. Please change the directory of your ScanJobDefiniton.`)
    }

    return { fileName, resultType, uploadUrl };
  });

  console.log('Lurcher is starting up.');
  console.log(
    'Once the scan is done, the following files are to be extracted.'
  );
  for (const { fileName, resultType } of filesToExtract) {
    console.log(` - ${fileName} (${resultType})`);
  }

  const podname = process.env['HOSTNAME'];

  if (!skipK8s) {
    const kc = new KubeConfig();
    kc.loadFromCluster();
    const client = kc.makeApiClient(CoreV1Api);

    // eslint-disable-next-line no-constant-condition
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
        const mainContainerState = mainContainerStatus.state.terminated;
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

  for (const { fileName, uploadUrl, resultType } of filesToExtract) {
    try {
      const { uploadSize, uploadDuration } = await uploadFile(
        fileName,
        uploadUrl
      );

      console.log(
        ` - ${fileName} (${uploadSize}bytes) uploaded in ${uploadDuration}ms`
      );

      files.push({ fileName, uploadSize, resultType });
    } catch (error) {
      console.error(`Failed to upload File: ${fileName}`);

      console.error(error.request.headers);
    }
  }

  try {
    await request.post({
      url: `${engineAddress}/api/v1alpha/scan-job/${scanId}/scan-completion`,
      json: {
        files,
      },
    });
  } catch (error) {
    console.error(`Failed mark scan as completed with the engine`);
  }
}

function uploadFile(fileName, uploadUrl) {
  return new Promise((resolve, reject) => {
     getFileSize(fileName).then(
      (fileSize) => {
        const startTime = new Date();

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.createReadStream(path.join('/home/securecodebox/', path.basename(fileName)))
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
       })
  });
}

function getFileSize(fileName) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.stat(path.join('/home/securecodebox/', path.basename(fileName)), (error, stat) => {
      if (error) {
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

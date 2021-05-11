// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const k8s = require("@kubernetes/client-node");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCRDApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api);
const k8sPodsApi = kc.makeApiClient(k8s.CoreV1Api);

let namespace = "integration-tests";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms * 1000));

async function deleteScan(name) {
  await k8sCRDApi.deleteNamespacedCustomObject(
    "execution.securecodebox.io",
    "v1",
    namespace,
    "scans",
    name,
    {}
  );
}

async function getScan(name) {
  const { body: scan } = await k8sCRDApi.getNamespacedCustomObjectStatus(
    "execution.securecodebox.io",
    "v1",
    namespace,
    "scans",
    name
  );
  return scan;
}

async function displayAllLogsForJob(jobName) {
  console.log(`Listing logs for Job '${jobName}':`);
  const {
    body: { items: pods },
  } = await k8sPodsApi.listNamespacedPod(
    namespace,
    true,
    undefined,
    undefined,
    undefined,
    `job-name=${jobName}`
  );

  if (pods.length === 0) {
    console.log(`No Pods found for Job '${jobName}'`);
  }

  for (const pod of pods) {
    console.log(
      `Listing logs for Job '${jobName}' > Pod '${pod.metadata.name}':`
    );

    for (const container of pod.spec.containers) {
      try {
        const response = await k8sPodsApi.readNamespacedPodLog(
          pod.metadata.name,
          namespace,
          container.name
        );
        console.log(`Container ${container.name}:`);
        console.log(response.body);
      } catch (exception) {
        console.error(
          `Failed to display logs of container ${container.name}: ${exception.body.message}`
        );
      }
    }
  }
}

async function logJobs() {
  try {
    const { body: jobs } = await k8sBatchApi.listNamespacedJob(namespace);

    console.log("Logging spec & status of jobs in namespace");

    for (const job of jobs.items) {
      console.log(`Job: '${job.metadata.name}' Spec:`);
      console.log(JSON.stringify(job.spec, null, 2));
      console.log(`Job: '${job.metadata.name}' Status:`);
      console.log(JSON.stringify(job.status, null, 2));

      await displayAllLogsForJob(job.metadata.name);
    }
  } catch (error) {
    console.error("Failed to list Jobs");
    console.error(error);
  }
}

async function disasterRecovery(scanName) {
  const scan = await getScan(scanName);
  console.error("Last Scan State:");
  console.dir(scan);
  await logJobs();
}

/**
 *
 * @param {string} name name of the scan. Actual name will be suffixed with a random number to avoid conflicts
 * @param {string} scanType type of the scan. Must match the name of a ScanType CRD
 * @param {string[]} parameters cli argument to be passed to the scanner
 * @param {number} timeout in seconds
 * @returns {scan.findings} returns findings { categories, severities, count }
 */
async function scan(name, scanType, parameters = [], timeout = 180) {
  namespace ="integration-tests"
  const scanDefinition = {
    apiVersion: "execution.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      // Use `generateName` instead of name to generate a random suffix and avoid name clashes
      generateName: `${name}-`,
    },
    spec: {
      scanType,
      parameters,
    },
  };

  const { body } = await k8sCRDApi.createNamespacedCustomObject(
    "execution.securecodebox.io",
    "v1",
    namespace,
    "scans",
    scanDefinition
  );

  const actualName = body.metadata.name;

  for (let i = 0; i < timeout; i++) {
    await sleep(1);
    const { status } = await getScan(actualName);

    if (status && status.state === "Done") {
      // Wait a couple seconds to give kubernetes more time to update the fields
      await sleep(2);
      const { status } = await getScan(actualName);
      await deleteScan(actualName);
      return status.findings;
    } else if (status && status.state === "Errored") {
      console.error("Scan Errored");
      await disasterRecovery(actualName);

      throw new Error(
        `Scan failed with description "${status.errorDescription}"`
      );
    }
  }
  console.error("Scan Timed out!");
  await disasterRecovery(actualName);

  throw new Error("timed out while waiting for scan results");
}

/**
 *
 * @param {string} name name of the scan. Actual name will be sufixed with a random number to avoid conflicts
 * @param {string} scanType type of the scan. Must match the name of a ScanType CRD
 * @param {string[]} parameters cli argument to be passed to the scanner
 * @param {string} nameCascade name of cascading scan
 * @param {object} matchLabels set invasive and intensive of cascading scan
 * @param {number} timeout in seconds
 * @returns {scan.findings} returns findings { categories, severities, count }
 */
async function cascadingScan(name, scanType, parameters = [], { nameCascade, matchLabels }, timeout = 180) {
  namespace = "cascading-tests";

  const scanDefinition = {
    apiVersion: "execution.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      // Use `generateName` instead of name to generate a random suffix and avoid name clashes
      generateName: `${name}-`,
    },
    spec: {
      scanType,
      parameters,
      cascades: {
        matchLabels,
      }
    },
  };

  const { body } = await k8sCRDApi.createNamespacedCustomObject(
    "execution.securecodebox.io",
    "v1",
    namespace,
    "scans",
    scanDefinition
  );

  const actualName = body.metadata.name;

  for (let i = 0; i < timeout; i++) {
    await sleep(1);
    const { status } = await getScan(actualName);

    if (status && status.state === "Done") {
      // Wait a couple seconds to give kubernetes more time to update the fields
      await sleep(5);
      console.log("First Scan finished")
      console.log(`First Scan Status: ${JSON.stringify(status, undefined, 2)}`)

      break;
    } else if (status && status.state === "Errored") {
      console.error("Scan Errored");
      await disasterRecovery(actualName);
      throw new Error(
        `Initial Scan failed with description "${status.errorDescription}"`
      );
    }

    if (i === (timeout - 1)) {
      throw new Error(
        `Initial Scan timed out failed`
      );
    }
  }

  const { body: scans } = await k8sCRDApi.listNamespacedCustomObject(
    "execution.securecodebox.io",
    "v1",
    namespace,
    "scans"
  );

  let cascadedScan = null;

  for (const scan of scans.items) {
    if (scan.metadata.annotations && scan.metadata.annotations["cascading.securecodebox.io/chain"] === nameCascade) {
      cascadedScan = scan;
      break;
    }
  }

  if (cascadedScan === null) {
    console.warn(`Didn't find matching cascaded scan in available scans: ${JSON.stringify(scans.items, undefined, 2)}`)
    throw new Error(`Didn't find cascaded Scan for ${nameCascade}`)
  }
  const actualNameCascade = cascadedScan.metadata.name;

  for (let j = 0; j < timeout; j++) {
    await sleep(1)
    const { status: statusCascade } = await getScan(actualNameCascade);

    if (statusCascade && statusCascade.state === "Done") {
      await sleep(2);
      const { status: statusCascade } = await getScan(actualNameCascade);

      await deleteScan(actualName);
      await deleteScan(actualNameCascade);
      return statusCascade.findings;
    } else if (statusCascade && statusCascade.state === "Errored") {
      console.error("Scan Errored");
      await disasterRecovery(actualName);
      await disasterRecovery(actualNameCascade);
      throw new Error(
        `Cascade Scan failed with description "${statusCascade.errorDescription}"`
      );
    }
  }
  console.error("Cascade Scan Timed out!");
  await disasterRecovery(actualName);
  await disasterRecovery(actualNameCascade);

  throw new Error("timed out while waiting for scan results");
}

module.exports.scan = scan;
module.exports.cascadingScan = cascadingScan;

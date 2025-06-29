// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import {
  KubeConfig,
  CustomObjectsApi,
  BatchV1Api,
  CoreV1Api,
} from "@kubernetes/client-node";

const kc = new KubeConfig();

// connect to localhost cluster forwarded via kubectl proxy to workaround auth issues in bun: https://github.com/oven-sh/bun/issues/7332
kc.loadFromOptions({
  clusters: [
    {
      name: "localhost",
      cluster: {
        server: "http://localhost:8001",
        skipTLSVerify: true, // no tls on proxy
      },
    },
  ],
  users: [
    {
      name: "default",
    },
  ],
  contexts: [
    {
      name: "default",
      context: {
        cluster: "localhost",
        user: "default",
        namespace: "integration-tests",
      },
    },
  ],
  currentContext: "default",
});

let k8sCRDApi: CustomObjectsApi, k8sBatchApi: BatchV1Api, k8sPodsApi: CoreV1Api;

function getKubernetesAPIs() {
  if (!k8sCRDApi) {
    k8sCRDApi = kc.makeApiClient(CustomObjectsApi);
  }
  if (!k8sBatchApi) {
    k8sBatchApi = kc.makeApiClient(BatchV1Api);
  }
  if (!k8sPodsApi) {
    k8sPodsApi = kc.makeApiClient(CoreV1Api);
  }

  return { k8sCRDApi, k8sBatchApi, k8sPodsApi };
}
let namespace = "integration-tests";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms * 1000));

async function deleteScan(name, k8sApis = getKubernetesAPIs()) {
  await k8sApis.k8sCRDApi.deleteNamespacedCustomObject({
    group: "execution.securecodebox.io",
    version: "v1",
    plural: "scans",
    name: name,
    namespace,
  });
}

async function getScan(name, k8sApis = getKubernetesAPIs()) {
  return await k8sApis.k8sCRDApi.getNamespacedCustomObjectStatus({
    group: "execution.securecodebox.io",
    version: "v1",
    plural: "scans",
    name,
    namespace,
  });
}

async function displayAllLogsForJob(jobName, k8sApis = getKubernetesAPIs()) {
  console.log(`Listing logs for Job '${jobName}':`);
  const pods = await k8sApis.k8sPodsApi.listNamespacedPod({
    labelSelector: `job-name=${jobName}`,
    namespace,
  });

  if (pods.items.length === 0) {
    console.log(`No Pods found for Job '${jobName}'`);
  }

  for (const pod of pods.items) {
    console.log(
      `Listing logs for Job '${jobName}' > Pod '${pod.metadata?.name}':`,
    );

    for (const container of pod.spec?.containers || []) {
      try {
        if (!pod.metadata?.name) throw new Error("pod name is undefined");
        const logs = await k8sApis.k8sPodsApi.readNamespacedPodLog({
          name: pod.metadata.name,
          namespace,
          container: container.name,
        });
        console.log(`Container ${container.name}:`);
        console.log(logs);
      } catch (exception) {
        console.error(
          `Failed to display logs of container ${container.name}: ${exception}`,
        );
      }
    }
  }
}

async function logJobs(k8sApis = getKubernetesAPIs()) {
  try {
    const jobs = await k8sApis.k8sBatchApi.listNamespacedJob({
      namespace,
    });

    console.log("Logging spec & status of jobs in namespace");

    for (const job of jobs.items) {
      console.log(`Job: '${job.metadata?.name}' Spec:`);
      console.log(JSON.stringify(job.spec, null, 2));
      console.log(`Job: '${job.metadata?.name}' Status:`);
      console.log(JSON.stringify(job.status, null, 2));

      await displayAllLogsForJob(job.metadata?.name, k8sApis);
    }
  } catch (error) {
    console.error("Failed to list Jobs");
    console.error(error);
  }
}

async function disasterRecovery(scanName, k8sApis) {
  const scan = await getScan(scanName, k8sApis);
  console.error("Last Scan State:");
  console.dir(scan);
  await logJobs(k8sApis);
}

/**
 *
 * @param {string} name name of the scan. Actual name will be suffixed with a random number to avoid conflicts
 * @param {string} scanType type of the scan. Must match the name of a ScanType CRD
 * @param {string[]} parameters cli argument to be passed to the scanner
 * @param {number} timeout in seconds
 * @param {object[]} volumes definitions for kubernetes volumes that should be used. Optional, useful for initContainers (see below)
 * @param {object[]} volumeMounts definitions for kubernetes volume mounts that should be used. Optional, useful for initContainers (see below)
 * @param {object[]} initContainers definitions for initContainers that should be added to the scan job to provision files for the scanner. Optional.
 * @param {CRDApi} CRDApi kubernetes api client for CRDs. Optional, will be created if not provided.
 * @param {BatchApi} BatchApi kubernetes api client for BatchV1Api. Optional, will be created if not provided.
 * @param {PodsApi} PodsApi kubernetes api client for CoreV1Api. Optional, will be created if not provided.
 * @returns {scan.findings} returns findings { categories, severities, count }
 */
export async function scan(
  name,
  scanType,
  parameters = [],
  timeout = 180,
  volumes = [],
  volumeMounts = [],
  initContainers = [],
  k8sApis = getKubernetesAPIs(),
) {
  namespace = "integration-tests";
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
      volumes,
      volumeMounts,
      initContainers,
    },
  };
  const scan = await k8sApis.k8sCRDApi.createNamespacedCustomObject({
    group: "execution.securecodebox.io",
    version: "v1",
    plural: "scans",
    namespace,
    body: scanDefinition,
  });

  const actualName = scan.metadata.name;

  for (let i = 0; i < timeout; i++) {
    await sleep(1);
    const { status } = await getScan(actualName, k8sApis);

    if (status && status.state === "Done") {
      // Wait a couple seconds to give kubernetes more time to update the fields
      await sleep(2);
      const { status } = await getScan(actualName, k8sApis);
      await deleteScan(actualName, k8sApis);
      return status.findings;
    } else if (status && status.state === "Errored") {
      console.error("Scan Errored");
      await disasterRecovery(actualName, k8sApis);

      throw new Error(
        `Scan failed with description "${status.errorDescription}"`,
      );
    }
  }
  console.error("Scan Timed out!");
  await disasterRecovery(actualName, k8sApis);

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
 * @param {CRDApi} CRDApi kubernetes api client for CRDs. Optional, will be created if not provided.
 * @param {BatchApi} BatchApi kubernetes api client for BatchV1Api. Optional, will be created if not provided.
 * @param {PodsApi} PodsApi kubernetes api client for CoreV1Api. Optional, will be created if not provided.
 *
 * @returns {scan.findings} returns findings { categories, severities, count }
 */
export async function cascadingScan(
  name,
  scanType,
  parameters = [],
  { nameCascade, matchLabels },
  timeout = 180,
  k8sApis = getKubernetesAPIs(),
) {
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
      },
    },
  };

  const scan = await k8sApis.k8sCRDApi.createNamespacedCustomObject({
    group: "execution.securecodebox.io",
    version: "v1",
    plural: "scans",
    namespace,
    body: scanDefinition,
  });

  const actualName: string = scan.metadata.name;

  for (let i = 0; i < timeout; i++) {
    await sleep(1);
    const { status } = await getScan(actualName, k8sApis);

    if (status && status.state === "Done") {
      // Wait a couple seconds to give kubernetes more time to update the fields
      await sleep(5);
      console.log("First Scan finished");
      console.log(`First Scan Status: ${JSON.stringify(status, undefined, 2)}`);

      break;
    } else if (status && status.state === "Errored") {
      console.error("Scan Errored");
      await disasterRecovery(actualName, k8sApis);
      throw new Error(
        `Initial Scan failed with description "${status.errorDescription}"`,
      );
    }

    if (i === timeout - 1) {
      throw new Error(`Initial Scan timed out failed`);
    }
  }

  const scans = await k8sApis.k8sCRDApi.listNamespacedCustomObject({
    group: "execution.securecodebox.io/v1",
    version: "v1",
    plural: "Scan",
    namespace,
  });

  const cascadedScan = scans.items.find((scan) => {
    return (
      scan.metadata.annotations &&
      scan.metadata.annotations["cascading.securecodebox.io/chain"] ===
        nameCascade
    );
  });
  if (cascadedScan === null) {
    console.warn(
      `Didn't find matching cascaded scan in available scans: ${JSON.stringify(scans.items, undefined, 2)}`,
    );
    throw new Error(`Didn't find cascaded Scan for ${nameCascade}`);
  }
  const actualNameCascade = cascadedScan.metadata?.name;

  for (let j = 0; j < timeout; j++) {
    await sleep(1);
    const { status: statusCascade } = await getScan(actualNameCascade, k8sApis);

    if (statusCascade && statusCascade.state === "Done") {
      await sleep(2);
      const { status: statusCascade } = await getScan(
        actualNameCascade,
        k8sApis,
      );

      await deleteScan(actualName, k8sApis);
      await deleteScan(actualNameCascade, k8sApis);
      return statusCascade.findings;
    } else if (statusCascade && statusCascade.state === "Errored") {
      console.error("Scan Errored");
      await disasterRecovery(actualName, k8sApis);
      await disasterRecovery(actualNameCascade, k8sApis);
      throw new Error(
        `Cascade Scan failed with description "${statusCascade.errorDescription}"`,
      );
    }
  }
  console.error("Cascade Scan Timed out!");
  await disasterRecovery(actualName, k8sApis);
  await disasterRecovery(actualNameCascade, k8sApis);

  throw new Error("timed out while waiting for scan results");
}

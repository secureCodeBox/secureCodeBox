const k8s = require("@kubernetes/client-node");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCRDApi = kc.makeApiClient(k8s.CustomObjectsApi);

const namespace = "integration-tests";

const sleep = duration =>
  new Promise(resolve => setTimeout(resolve, duration * 1000));

async function deleteScan(name) {
  await k8sCRDApi.deleteNamespacedCustomObject(
    "execution.experimental.securecodebox.io",
    "v1",
    namespace,
    "scans",
    name,
    {}
  );
}

/**
 *
 * @param {string} name name of the scan. Actual name will be sufixed with a random number to avoid conflicts
 * @param {string} scanType type of the scan. Must match the name of a ScanType CRD
 * @param {string[]} parameters cli argument to be passed to the scanner
 * @param {number} timeout in seconds
 */
async function scan(name, scanType, parameters = [], timeout = 180) {
  const scanDefinition = {
    apiVersion: "execution.experimental.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      // Use `generateName` instead of name to generate a random sufix and avoid name clashes
      generateName: `${name}-`
    },
    spec: {
      scanType,
      parameters
    }
  };

  const { body } = await k8sCRDApi.createNamespacedCustomObject(
    "execution.experimental.securecodebox.io",
    "v1",
    namespace,
    "scans",
    scanDefinition
  );

  const actualName = body.metadata.name;

  for (let i = 0; i < timeout; i++) {
    await sleep(1);

    const { body } = await k8sCRDApi.getNamespacedCustomObjectStatus(
      "execution.experimental.securecodebox.io",
      "v1",
      namespace,
      "scans",
      actualName
    );

    const scanStatus = body.status;

    if (scanStatus && scanStatus.state === "Done") {
      await deleteScan(actualName);
      return scanStatus.findings;
    }
  }

  throw new Error("timed out while waiting for scan results");
}

module.exports.scan = scan;
const k8s = require("@kubernetes/client-node");

// configure k8s client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApiCRD = kc.makeApiClient(k8s.CustomObjectsApi);

async function startSubsequentSecureCodeBoxScan({
  parentScan,
  name,
  scanType,
  parameters,
}) {
  const scanDefinition = {
    apiVersion: "execution.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      name: name,
      labels: {
        ...parentScan.metadata.labels,
      },
      annotations: {
        "securecodebox.io/hook": "imperative-subsequent-scans",
        "securecodebox.io/parent-scan": parentScan.metadata.name,
      },
      ownerReferences: [
        {
          apiVersion: "execution.securecodebox.io/v1",
          blockOwnerDeletion: true,
          controller: true,
          kind: "Scan",
          name: parentScan.metadata.name,
          uid: parentScan.metadata.uid,
        },
      ],
    },
    spec: {
      scanType,
      parameters,
    },
  };

  // Changing label 'scan-type' (if defined by parent scan) to to the given scanType for the subsequent scan
  if( scanDefinition.metadata.labels && scanDefinition.metadata.labels['scan-type'] ) {
    scanDefinition.metadata.labels['scan-type'] = scanType;
  }

  try {
    // Starting another subsequent sslyze scan based on the nmap results
    // found at: https://github.com/kubernetes-client/javascript/blob/79736b9a608c18d818de61a6b44503a08ea3a78f/src/gen/api/customObjectsApi.ts#L209
    await k8sApiCRD.createNamespacedCustomObject(
      "execution.securecodebox.io",
      "v1",
      process.env["NAMESPACE"],
      "scans",
      scanDefinition,
      "false"
    );
  } catch (error) {
    console.error(`Failed to start Scan ${name}`);
    console.error(error);
  }
}

module.exports.startSubsequentSecureCodeBoxScan = startSubsequentSecureCodeBoxScan;

import * as k8s from "@kubernetes/client-node";

// configure k8s client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApiCRD = kc.makeApiClient(k8s.CustomObjectsApi);

const namespace = process.env["NAMESPACE"];

export async function startSubsequentSecureCodeBoxScan({
  name,
  parentScan,
  scanType,
  parameters,
  generatedBy,
}) {
  let cascadingChain: Array<string> = [];

  if (parentScan.metadata.annotations["cascading.securecodebox.io/chain"]) {
    cascadingChain = parentScan.metadata.annotations[
      "cascading.securecodebox.io/chain"
    ].split(",");
  }

  const scanDefinition = {
    apiVersion: "execution.experimental.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      generateName: `${name}-`,
      labels: {
        ...parentScan.metadata.labels,
      },
      annotations: {
        "securecodebox.io/hook": "declarative-subsequent-scans",
        "cascading.securecodebox.io/parent-scan": parentScan.metadata.name,
        "cascading.securecodebox.io/chain": [
          ...cascadingChain,
          generatedBy,
        ].join(","),
      },
      ownerReferences: [
        {
          apiVersion: "execution.experimental.securecodebox.io/v1",
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

  console.log(`Starting Scan ${name}`);

  try {
    // Submitting the Scan to the kubernetes api
    await k8sApiCRD.createNamespacedCustomObject(
      "execution.experimental.securecodebox.io",
      "v1",
      namespace,
      "scans",
      scanDefinition,
      "false"
    );
  } catch (error) {
    console.error(`Failed to start Scan ${name}`);
    console.error(error);
  }
}

export async function getCascadingRulesFromCluster() {
  try {
    const response: any = await k8sApiCRD.listNamespacedCustomObject(
      "cascading.experimental.securecodebox.io",
      "v1",
      namespace,
      "cascadingrules"
    );

    console.log(`Fetched ${response.body.items.length} CascadingRules`);
    return response.body.items;
  } catch (err) {
    console.error("Failed to get CascadingRules from the kubernetes api");
    console.error(err);
    process.exit(1);
  }
}

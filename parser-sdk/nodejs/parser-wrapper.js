const axios = require("axios");
const { parse } = require("./parser/parser");
const { v4: uuid } = require('uuid');
const k8s = require("@kubernetes/client-node");
const {
  uploadFile,
  NAMESPACE,
  SCAN_NAME,
  updateScanStatus
} = require("../../scb-sdk/nodejs/scb-sdk");

const kc = new k8s.KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

async function extractScan() {
  try {
    const { body } = await k8sApi.getNamespacedCustomObject(
      "execution.securecodebox.io",
      "v1",
      NAMESPACE,
      "scans",
      SCAN_NAME
    );
    return body;
  } catch (err) {
    console.error("Failed to get Scan from the kubernetes api");
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  console.log("Starting Parser");
  let scan = await extractScan();

  const resultFileUrl = process.argv[2];
  const resultUploadUrl = process.argv[3];

  console.log("Fetching result file");
  const { data } = await axios.get(resultFileUrl);
  console.log("Fetched result file");

  let findings = [];
  try {
    findings = await parse(data, scan);
  } catch (error) {
    console.error("Parser failed with error:");
    console.error(error);
    process.exit(1);
  }

  console.log(`Transformed raw result file into ${findings.length} findings`);

  console.log("Adding UUIDs to the findings");
  const findingsWithIds = findings.map((finding) => {
    return {
      ...finding,
      id: uuid(),
    };
  });

  await updateScanStatus(findings);

  console.log(`Uploading results to the file storage service`);

  await uploadFile(resultUploadUrl, findingsWithIds)

  console.log(`Completed parser`);
}

main();

// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const axios = require("axios");
const { handle } = require("./hook/hook");
const k8s = require("@kubernetes/client-node");

const scanName = process.env["SCAN_NAME"];
const namespace = process.env["NAMESPACE"];
console.log(`Starting hook for Scan "${scanName}"`);

const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

function downloadFile(url) {
  return axios.get(url);
}

function getRawResults() {
  const rawResultUrl = process.argv[2];
  return downloadFile(rawResultUrl).then(({ data }) => {
    console.log(`Fetched raw result file contents from the file storage`);
    return data;
  });
}

function getFindings() {
  const findingsUrl = process.argv[3];
  return downloadFile(findingsUrl).then(({ data: findings }) => {
    console.log(`Fetched ${findings.length} findings from the file storage`);
    return findings;
  });
}

function uploadFile(url, fileContents) {
  return axios
    .put(url, fileContents, {
      headers: { "content-type": "" },
    })
    .catch(function(error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          `File Upload Failed with Response Code: ${error.response.status}`
        );
        console.error(`Error Response Body: ${error.response.data}`);
      } else if (error.request) {
        console.error(
          "No response received from FileStorage when uploading finding"
        );
        console.error(error);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }
      process.exit(1);
    });
}

function updateRawResults(fileContents) {
  const rawResultUploadUrl = process.argv[4];
  if (rawResultUploadUrl === undefined) {
    console.error(
      "Tried to upload RawResults but didn't find a valid URL to upload the findings to."
    );
    console.error("This probably means that this hook is a ReadOnly hook.");
    console.error(
      "If you want to change RawResults you'll need to use a ReadAndWrite Hook."
    );
  }
  return uploadFile(rawResultUploadUrl, fileContents);
}

function severityCount(findings, severity) {
  return findings.filter(
    ({ severity: findingSeverity }) =>
      findingSeverity.toUpperCase() === severity
  ).length;
}

async function updateFindings(findings) {
  const findingsUploadUrl = process.argv[5];
  if (findingsUploadUrl === undefined) {
    console.error(
      "Tried to upload Findings but didn't find a valid URL to upload the findings to."
    );
    console.error("This probably means that this hook is a ReadOnly hook.");
    console.error(
      "If you want to change Findings you'll need to use a ReadAndWrite Hook."
    );
  }
  await uploadFile(findingsUploadUrl, JSON.stringify(findings));

  // Update the scans findingStats (severities, categories, or the count) of the scan results
  const findingCategories = new Map();
  for (const { category } of findings) {
    if (findingCategories.has(category)) {
      findingCategories.set(category, findingCategories.get(category) + 1);
    } else {
      findingCategories.set(category, 1);
    }
  }

  await k8sApi.patchNamespacedCustomObjectStatus(
    "execution.securecodebox.io",
    "v1",
    namespace,
    "scans",
    scanName,
    {
      status: {
        findings: {
          count: findings.length,
          severities: {
            informational: severityCount(findings, "INFORMATIONAL"),
            low: severityCount(findings, "LOW"),
            medium: severityCount(findings, "MEDIUM"),
            high: severityCount(findings, "HIGH"),
          },
          categories: Object.fromEntries(findingCategories.entries()),
        },
      },
    },
    undefined,
    undefined,
    undefined,
    { headers: { "content-type": "application/merge-patch+json" } }
  );
  console.log("Updated status successfully");
}

async function main() {
  let scan;
  try {
    const { body } = await k8sApi.getNamespacedCustomObject(
      "execution.securecodebox.io",
      "v1",
      namespace,
      "scans",
      scanName
    );
    scan = body;
  } catch (err) {
    console.error("Failed to get Scan from the kubernetes api");
    console.error(err);
    process.exit(1);
  }

  try {
    await handle({
      getRawResults,
      getFindings,
      updateRawResults,
      updateFindings,
      scan,
    });
  } catch (error) {
    console.error("Error was thrown while running hooks handle function");
    console.error(error);
    process.exit(1);
  }

  console.log(`Hook completed`);
}

main();

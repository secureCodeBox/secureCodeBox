const axios = require("axios");
const k8s = require("@kubernetes/client-node");
const kc = new k8s.KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

const NAMESPACE = process.env["NAMESPACE"];
const SCAN_NAME = process.env["SCAN_NAME"];

function severityCount(findings, severity) {
  return findings.filter(
    ({ severity: findingSeverity }) =>
      findingSeverity.toUpperCase() === severity
  ).length;
}

async function uploadFile(url, fileContents) {
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

async function downloadFile(url) {
  return axios.get(url);
}

async function updateScanStatus(findings) {

  try {
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
      NAMESPACE,
      "scans",
      SCAN_NAME,
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
  } catch (err) {
    console.error("Failed to update Scan Status via the kubernetes api");
    console.error(err);
    process.exit(1);
  }
}

module.exports.uploadFile = uploadFile;
module.exports.downloadFile = downloadFile;
module.exports.NAMESPACE = NAMESPACE;
module.exports.SCAN_NAME = SCAN_NAME;
module.exports.updateScanStatus = updateScanStatus;

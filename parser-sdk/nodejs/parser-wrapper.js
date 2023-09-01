// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const axios = require("axios");
const { parse } = require("./parser/parser");
const { validate, addIdsAndDates } = require("./parser-utils");
const k8s = require("@kubernetes/client-node");

const kc = new k8s.KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);
const scanName = process.env["SCAN_NAME"];
const namespace = process.env["NAMESPACE"];

function severityCount(findings, severity) {
  return findings.filter(
    ({ severity: findingSeverity }) =>
      findingSeverity.toUpperCase() === severity
  ).length;
}

async function uploadResultToFileStorageService(
  resultUploadUrl,
  findingsWithIdsAndDates
) {
  return axios
    .put(resultUploadUrl, findingsWithIdsAndDates, {
      headers: { "content-type": "" },
      maxBodyLength: Infinity,
    })
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          `Finding Upload Failed with Response Code: ${error.response.status}`
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
  } catch (err) {
    console.error("Failed to update Scan Status via the kubernetes api");
    console.error(err);
    process.exit(1);
  }
}

async function extractScan() {
  try {
    const { body } = await k8sApi.getNamespacedCustomObject(
      "execution.securecodebox.io",
      "v1",
      namespace,
      "scans",
      scanName
    );
    return body;
  } catch (err) {
    console.error("Failed to get Scan from the kubernetes api");
    console.error(err);
    process.exit(1);
  }

}

async function extractParseDefinition(scan) {
  try {
    const { body } = await k8sApi.getNamespacedCustomObject(
      "execution.securecodebox.io",
      "v1",
      namespace,
      "parsedefinitions",
      scan.status.rawResultType
    );
    return body;
  } catch (err) {
    console.error("Failed to get ParseDefinition from the kubernetes api");
    console.error(err);
    process.exit(1);
  }
}




async function main() {
  console.log("Starting Parser");
  let scan = await extractScan();
  console.log("Extracted Scan" + JSON.stringify(scan));
  let parseDefinition = await extractParseDefinition(scan);
  console.log("Extracted ParseDefinition" + JSON.stringify(parseDefinition));
  const resultFileUrl = process.argv[2];
  const resultUploadUrl = process.argv[3];

  console.log("Fetching result file");
  let response;
  if(scan.spec.scanType === "amass"){
    response = await axios.get(resultFileUrl, {responseType: 'arraybuffer'});
  } else {
    response = await axios.get(resultFileUrl);
  }

  console.log("Fetched result file");

  let findings = [];
  try {
    findings = await parse(response.data, scan);
  } catch (error) {
    console.error("Parser failed with error:");
    console.error(error);
    process.exit(1);
  }

  console.log(`Transformed raw result file into ${findings.length} findings`);

  console.log("Adding UUIDs and Dates to the findings");
  const findingsWithIdsAndDates = addIdsAndDates(findings);

  const crash_on_failed_validation = process.env["CRASH_ON_FAILED_VALIDATION"] === "true"
  console.log("Validating Findings. Environment variable CRASH_ON_FAILED_VALIDATION is set to %s", crash_on_failed_validation);
  try {
    await validate(findingsWithIdsAndDates);
    console.log("The Findings were successfully validated")
  } catch (error) {
    console.error("The Findings Validation failed with error(s):");
    console.error(error);
    if (crash_on_failed_validation) {
      process.exit(1);
    }
  }

  await updateScanStatus(findings);

  console.log(`Uploading results to the file storage service`);

  await uploadResultToFileStorageService(
    resultUploadUrl,
    findingsWithIdsAndDates
  );

  console.log(`Completed parser`);
}

main();

module.exports.addIdsAndDates = addIdsAndDates;

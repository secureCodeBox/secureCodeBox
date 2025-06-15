// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { Buffer } from "node:buffer";
import {
  KubeConfig,
  CustomObjectsApi,
  setHeaderOptions,
  PatchStrategy,
} from "@kubernetes/client-node";

import { parse } from "./parser/parser.js";
import { validate, addIdsAndDates, addScanMetadata } from "./parser-utils.js";

const kc = new KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(CustomObjectsApi);

const scanName = process.env["SCAN_NAME"];
const namespace = process.env["NAMESPACE"];

function severityCount(findings, severity) {
  return findings.filter(
    ({ severity: findingSeverity }) =>
      findingSeverity.toUpperCase() === severity,
  ).length;
}

async function uploadResultToFileStorageService(
  resultUploadUrl,
  findingsWithIdsAndDates,
) {
  try {
    const res = await fetch(resultUploadUrl, {
      method: "PUT",
      headers: { "content-type": "" },
      body: JSON.stringify(findingsWithIdsAndDates),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Finding Upload Failed with Response Code: ${res.status}`);
      console.error(`Error Response Body: ${text}`);
      process.exit(1);
    }
  } catch (error) {
    if (error.response) {
      console.error(
        `Finding Upload Failed with Response Code: ${error.response.status}`,
      );
      console.error(`Error Response Body: ${error.response.data}`);
    } else if (error.request) {
      console.error(
        "No response received from FileStorage when uploading finding",
      );
      console.error(error);
    } else {
      console.log("Error", error.message);
    }
    process.exit(1);
  }
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
      {
        group: "execution.securecodebox.io",
        version: "v1",
        namespace,
        plural: "scans",
        name: scanName,
        body: {
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
      },
      setHeaderOptions("Content-Type", PatchStrategy.MergePatch),
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
    return await k8sApi.getNamespacedCustomObject({
      group: "execution.securecodebox.io",
      version: "v1",
      plural: "scans",
      name: scanName,
      namespace,
    });
  } catch (err) {
    console.error("Failed to get Scan from the kubernetes api");
    console.error(err);
    process.exit(1);
  }
}

async function extractParseDefinition(scan) {
  try {
    return await k8sApi.getNamespacedCustomObject({
      group: "execution.securecodebox.io",
      version: "v1",
      plural: "parsedefinitions",
      name: scan.status.rawResultType,
      namespace,
    });
  } catch (err) {
    console.error("Failed to get ParseDefinition from the kubernetes api");
    console.error(err);
    process.exit(1);
  }
}

async function fetchResultFile(resultFileUrl, contentType) {
  try {
    const response = await fetch(resultFileUrl, { method: "GET" });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch result file: ${response.status} ${response.statusText}`,
      );
    }
    if (contentType === "Binary") {
      return Buffer.from(await response.arrayBuffer());
    } else {
      return await response.text();
    }
  } catch (err) {
    throw new Error(
      `Failed to fetch result file from ${resultFileUrl}: ${err.message}`,
    );
  }
}

async function main() {
  console.log("Starting Parser");
  let scan = await extractScan();
  let parseDefinition = await extractParseDefinition(scan);
  const resultFileUrl = process.argv[2];
  const resultUploadUrl = process.argv[3];

  console.log("Fetching result file");
  let data = null;
  try {
    data = await fetchResultFile(
      resultFileUrl,
      parseDefinition.spec.contentType,
    );
  } catch (error) {
    console.error("Failed to fetch scan result file for parser:");
    console.error(error);
    process.exit(1);
  }

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

  console.log("Adding UUIDs and Dates to the findings");
  const findingsWithIdsAndDates = addIdsAndDates(findings);
  console.log("Adding scan metadata to the findings");
  const findingsWithMetadata = addScanMetadata(findingsWithIdsAndDates, scan);

  const crash_on_failed_validation =
    process.env["CRASH_ON_FAILED_VALIDATION"] === "true";
  console.log(
    "Validating Findings. Environment variable CRASH_ON_FAILED_VALIDATION is set to %s",
    crash_on_failed_validation,
  );
  try {
    await validate(findingsWithMetadata);
    console.log("The Findings were successfully validated");
  } catch (error) {
    console.error("The Findings Validation failed with error(s):");
    console.error(error);
    if (crash_on_failed_validation) {
      process.exit(1);
    }
  }

  await updateScanStatus(findings);

  console.log(`Uploading results to the file storage service`);

  await uploadResultToFileStorageService(resultUploadUrl, findingsWithMetadata);

  console.log(`Completed parser`);
}

main();

// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import addFormats from "ajv-formats";
import { get } from "jsonpointer";
import Ajv from "ajv-draft-04";

const ajv = new Ajv();
addFormats(ajv);

export async function validate(findings) {
  const jsonSchemaString = await readFile(
    import.meta.dirname + "/findings-schema.json",
    "utf8",
  );
  const jsonSchema = JSON.parse(jsonSchemaString);
  const validator = ajv.compile(jsonSchema);
  const valid = validator(findings);
  if (!valid) {
    const errorMessage = generateErrorMessage(validator.errors, findings);
    throw new Error(errorMessage);
  }
}

export function addScanMetadata(findings, scan) {
  const scanMetadata = {
    created_at: scan.metadata.creationTimestamp,
    name: scan.metadata.name,
    namespace: scan.metadata.namespace,
    scan_type: scan.spec.scanType,
  };

  return findings.map((finding) => ({
    ...finding,
    scan: scanMetadata,
  }));
}

export function addIdsAndDates(findings) {
  return findings.map((finding) => {
    return {
      ...finding,
      id: randomUUID(),
      parsed_at: new Date().toISOString(),
    };
  });
}

// used for tests to validate if the parser sets all required fields correctly. Adds sample IDs and Dates to the findings which would normally be set by the parser-sdk.
export async function validateParser(findings) {
  const sampleScan = {
    metadata: {
      creationTimestamp: new Date().toISOString(),
      name: "sample-scan-name",
      namespace: "sample-namespace",
    },
    spec: {
      scanType: "sample-scan-type",
    },
  };
  // add sample IDs and Dates only if the findings Array is not empty
  const extendedData = addScanMetadata(addIdsAndDates(findings), sampleScan);
  return validate(extendedData);
}

function generateErrorMessage(errors, findings) {
  return JSON.stringify(
    errors.map((error) => {
      return {
        ...error,
        invalidValue: get(findings, error.instancePath),
      };
    }),
    null,
    2,
  );
}

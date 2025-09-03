// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from "node:crypto";

import addFormats from "ajv-formats";
import { get } from "jsonpointer";
import Ajv, { type ErrorObject } from "ajv-draft-04";
import findingsSchema from "./findings-schema.json" with { type: "json" };

const ajv = new Ajv();
addFormats(ajv);

export type Severity = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH";

export interface Reference {
  type: string;
  value: string;
}

export interface ScanSummary {
  created_at: string; // ISO8601 date-time
  name: string;
  namespace: string;
  scan_type: string;
}

// parsers do not need to set all fields as fields like the ID are set by the parser-sdk
export interface FindingFromParser {
  identified_at?: string | null; // ISO8601 date-time
  name: string;
  description?: string | null;
  category: string;
  severity: Severity;
  mitigation?: string | null;
  references?: Reference[] | null;
  attributes?: Record<string, unknown>;
  location?: string | null;
}

export interface FindingWithIdsAndDates extends FindingFromParser {
  id: string; // UUID v4
  parsed_at: string; // ISO8601 date-time
}

export interface Finding extends FindingWithIdsAndDates {
  scan: ScanSummary;
}

export interface Scan {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
  };
  spec: {
    scanType: string;
  };
  status: {
    rawResultType: string;
  };
}

export function validate(findings: unknown): asserts findings is Finding[] {
  const validator = ajv.compile(findingsSchema);
  const valid = validator(findings);
  if (!valid && validator.errors) {
    const errorMessage = generateErrorMessage(validator.errors, findings);
    throw new Error(errorMessage);
  } else if (!valid) {
    throw new Error("Validation of findings failed for unknown reasons.");
  }
}

export function addScanMetadata(
  findings: FindingWithIdsAndDates[],
  scan: Scan,
): Finding[] {
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

export function addIdsAndDates(
  findings: FindingFromParser[],
): FindingWithIdsAndDates[] {
  return findings.map((finding) => {
    return {
      ...finding,
      id: randomUUID(),
      parsed_at: new Date().toISOString(),
    };
  });
}

// used for tests to validate if the parser sets all required fields correctly. Adds sample IDs and Dates to the findings which would normally be set by the parser-sdk.
export function validateParser(findings: FindingFromParser[]) {
  const sampleScan: Scan = {
    metadata: {
      creationTimestamp: new Date().toISOString(),
      name: "sample-scan-name",
      namespace: "sample-namespace",
    },
    spec: {
      scanType: "sample-scan-type",
    },
    status: {
      rawResultType: "example-results",
    },
  };
  // add sample IDs and Dates only if the findings Array is not empty
  const extendedData = addScanMetadata(addIdsAndDates(findings), sampleScan);
  return validate(extendedData);
}

function generateErrorMessage(errors: ErrorObject[], findings: Finding[]) {
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

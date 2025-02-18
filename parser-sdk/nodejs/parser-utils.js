// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { readFile } = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const Ajv = require("ajv-draft-04");
const addFormats = require("ajv-formats");
const jsonpointer = require("jsonpointer");

const ajv = new Ajv();
addFormats(ajv);

function addIdsAndDates(findings) {
  return findings.map((finding) => {
    return {
      ...finding,
      id: randomUUID(),
      parsed_at: new Date().toISOString(),
    };
  });
}

function addScanMetadata(findings, scan) {
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

async function validateAgainstJsonSchema(findings) {
  const jsonSchemaString = await readFile(
    __dirname + "/findings-schema.json",
    "utf8"
  );
  const jsonSchema = JSON.parse(jsonSchemaString);
  const validator = ajv.compile(jsonSchema);
  const valid = validator(findings);
  if (!valid) {
    const errorMessage = generateErrorMessage(validator.errors, findings);
    throw new Error(errorMessage);
  }
}

async function addSampleIdsAndDatesAndValidate(findings) {
  const sampleScan = {
    metadata: {
      creationTimestamp: new Date().toISOString(),
      name: "sample-scan-name",
      namespace: "sample-namespace",
    },
    spec: {
      scanType: "sample-scan-type",
    },
  }
  // add sample IDs and Dates only if the findings Array is not empty
    const extendedData = addScanMetadata(addIdsAndDates(findings),sampleScan);
    return validateAgainstJsonSchema(extendedData);
}

function generateErrorMessage(errors, findings) {
  errors = errors.map((error) => {
    return { 
      ...error,
      invalidValue: jsonpointer.get(findings, error.instancePath),
    };
  });
  return JSON.stringify(errors, null, 2);
}

module.exports.addIdsAndDates = addIdsAndDates;
module.exports.addScanMetadata = addScanMetadata;
module.exports.validate = validateAgainstJsonSchema;
module.exports.validateParser = addSampleIdsAndDatesAndValidate;

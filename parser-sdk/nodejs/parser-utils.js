// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const Ajv = require("ajv-draft-04");
const ajv = new Ajv();
const addFormats = require("ajv-formats");
addFormats(ajv);
const util = require("util");
const jsonpointer = require("jsonpointer");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);
const { v4: uuid } = require("uuid");

function addIdsAndDates(findings) {
  return findings.map((finding) => {
    return {
      ...finding,
      id: uuid(),
      parsed_at: new Date().toISOString(),
    };
  });
}

async function validateAgainstJsonSchema(jsonData) {
  const jsonSchemaString = await readFile(
    __dirname + "/findings-schema.json",
    "utf8"
  );
  const jsonSchema = JSON.parse(jsonSchemaString);
  const validator = ajv.compile(jsonSchema);
  const valid = validator(jsonData);
  if (!valid) {
    const errorMessage = generateErrorMessage(validator.errors, jsonData);
    throw new Error(errorMessage);
  }
}

async function addSampleIdsAndDatesAndValidate(jsonData) {
  // add sample IDs and Dates only if the jsonData Array is not empty
    const extendedData = addIdsAndDates(jsonData);
    return validateAgainstJsonSchema(extendedData);
}

function generateErrorMessage(errors, jsonData) {
  errors = errors.map((error) => {
    return { 
      ...error,
      invalidValue: jsonpointer.get(jsonData, error.instancePath),
    };
  });
  return JSON.stringify(errors, null, 2);
}

module.exports.addIdsAndDates = addIdsAndDates;
module.exports.validate = validateAgainstJsonSchema;
module.exports.validateParser = addSampleIdsAndDatesAndValidate;

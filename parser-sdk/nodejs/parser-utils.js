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

function addHostnameOrIpToFindingObject(finding, unidentifiedString) {
  // this function assumes that unidentifiedString is either an ip or an url/hostname 
  // checking if a string is a valid url is pretty complicated, so it is only checked if the string is an ip.

  // first capture group is a potential protocol, the second capture group is the ip/hostname, the third capture group is a potential port
  // example: (ssh://)(1.1.1.1)(:20) or (http://)(google.de)(:80) or just 1.1.1.1 or just google.de
  let regex = /([a-zA-Z]+:\/\/*)?([^\/:]*)(:\d+)?/;
  let strippedString = regex.exec(unidentifiedString)[2];

  let isIp = require('net').isIP(strippedString);
  if (isIp) {
    finding.ip_address = strippedString;
  }
  else {
    finding.hostname = strippedString;
  }
  return finding;
}

module.exports.addIdsAndDates = addIdsAndDates;
module.exports.validate = validateAgainstJsonSchema;
module.exports.validateParser = addSampleIdsAndDatesAndValidate;
module.exports.addHostnameOrIpToFindingObject = addHostnameOrIpToFindingObject;

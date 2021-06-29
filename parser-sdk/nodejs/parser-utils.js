const fs = require("fs");
const Ajv = require("ajv-draft-04");
const ajv = new Ajv();
const util = require("util");
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

// eslint-disable-next-line
async function validate(jsonData) {
  const jsonSchemaString = await readFile(
    __dirname + "/findings-schema.json",
    "utf8"
  );
  const jsonSchema = JSON.parse(jsonSchemaString);
  const validator = ajv.compile(jsonSchema);
  const valid = validator(jsonData);
  if (!valid) {
    throw new Error(JSON.stringify(validator.errors, null, 2));
  }
}

// eslint-disable-next-line
async function addSampleIdsAndDatesAndValidate(jsonData) {
  const extendedData = addIdsAndDates(jsonData);
  validate(extendedData);
}

module.exports.addIdsAndDates = addIdsAndDates;
module.exports.validate = validate;
module.exports.validate_parser = addSampleIdsAndDatesAndValidate;

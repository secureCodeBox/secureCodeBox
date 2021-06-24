const fs = require("fs");
const Ajv = require("ajv-draft-04");
const ajv = new Ajv();
const util = require('util')
// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

// eslint-disable-next-line
async function validate(jsonData) {
  const jsonSchemaString = await readFile(
    __dirname + "/findings-schema.json","utf8"
  );
  const jsonSchema = JSON.parse(jsonSchemaString)  
  const validater = ajv.compile(jsonSchema);
  const valid = validater(jsonData);
  if(!valid){
    throw new Error(JSON.stringify(validater.errors,null,2))
  }
}

module.exports.validate = validate;

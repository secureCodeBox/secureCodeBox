const axios = require('axios');
const { parse } = require('./parser/parser');
const uuid = require('uuid/v4');

async function main() {
  const resultFileUrl = process.argv[2];
  const securityTestId = process.argv[3];
  const engineAddress = process.argv[4];

  const { data } = await axios.get(resultFileUrl);

  const findings = await parse(data);
  console.log(`Transformed raw result file into ${findings.length} findings.`);

  console.log('Adding UUIDs to the findings');
  const findingsWithIds = findings.map(finding => {
    return {
      ...finding,
      id: uuid(),
    };
  });

  console.log(`Submitting results to the engine.`);

  await axios.post(
    `${engineAddress}/api/v1alpha/scan-job/${securityTestId}/findings`,
    { findings: findingsWithIds }
  );

  console.log(`Completed parser.`);
}

main();

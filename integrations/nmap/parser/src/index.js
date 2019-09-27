const axios = require('axios');
const { parse } = require('./parser');

async function main() {
  const resultFileUrl = process.argv[2];
  const securityTestId = process.argv[3];
  const engineAddress = process.argv[4];

  const { data } = await axios.get(resultFileUrl);

  const findings = await parse(data);

  console.log(`Transformed raw result file into ${findings.length} findings.`);

  await axios.post(
    `${engineAddress}/api/v1alpha/scan-job/${securityTestId}/findings`,
    { findings }
  );

  console.log(`Completed parser.`);
}

main();

const axios = require('axios');

async function main() {
  const resultFileUrl = process.argv[2];

  console.log(resultFileUrl);

  const { data } = await axios.get(resultFileUrl);

  console.log(data);
}

main();

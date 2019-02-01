const axios = require('axios');

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

module.exports = async globalConfig => {
  console.log({ globalConfig });
  while (true) {
    try {
      await axios.get(globalConfig.engineUrl, { timeout: 1000 });
      return;
    } catch (error) {
      console.error(error);
      console.debug('Waiting for engine to complete startup');
    }

    await sleep(2000);
  }
};

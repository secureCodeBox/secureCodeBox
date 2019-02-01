const axios = require('axios');

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

async function startSecurityTest(...securityTest) {
  const { data } = await axios.put(
    `${global.engineUrl}/box/securityTests`,
    [...securityTest],
    {
      auth: {
        username: global.username,
        password: global.password,
      },
    }
  );

  const [id] = data;

  let triesLeft = 3;

  while (true) {
    const { data: securityTest, status } = await axios
      .get(`${global.engineUrl}/box/securityTests/${id}`, {
        auth: {
          username: global.username,
          password: global.password,
        },
      })
      .catch(err => {
        console.warn(
          `Polling for results returned a ${
            err.response.status
          } code. Trying ${triesLeft} more times.`
        );
        if (triesLeft-- <= 0) {
          console.error(
            'The engine returned error codes, multiple times while polling for securityTest results.'
          );
          console.error(
            'This usally indicated that the securityTest has encountered an error.'
          );
          console.error('Response payload:');
          console.error(err.response.data);
          throw err;
        }
      });

    if (status === 200) {
      return securityTest;
    }
    await sleep(100);
  }
}

module.exports.startSecurityTest = startSecurityTest;

module.exports.Time = {
  Second: 1000,
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
};

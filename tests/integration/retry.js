function runTest(handler) {
  return new Promise((resolve, reject) => {
    const result = handler((err) => (err ? reject(err) : resolve()));

    if (result && result.then) {
      result.catch(reject).then(resolve);
    } else {
      resolve();
    }
  });
}

async function retry(description, retries, handler, ...args) {
  if (!description || typeof description !== "string") {
    throw new Error("Invalid argument, description must be a string");
  }

  if (typeof retries === "function" && !handler) {
    handler = retries;
    retries = 1;
  }

  if (!retries || typeof retries !== "number" || retries < 1) {
    throw new Error("Invalid argument, retries must be a greather than 0");
  }

  test(
    description,
    async () => {
      let latestError;
      for (let tries = 0; tries < retries; tries++) {
        try {
          await runTest(handler);
          return;
        } catch (error) {
          latestError = error;
        }
      }

      throw latestError;
    },
    ...args
  );
}

module.exports = retry;

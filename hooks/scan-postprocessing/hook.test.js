const { handle } = require("./hook")

test("Should Add High Severity and Description", async () => {
  const findings = [
    {
      category: "Open Port",
      attributes: {
        hostname: "foobar.com",
        port: 23,
        state: "open"
      },
    },
  ];

  const rules = [{
    matches: {
      anyOf: [
        {
          category: "Open Port",
          attributes: {
            port: 23,
            state: "open"
          }
        },
      ]
    },
    override: {
      severity: "high",
      description: "Telnet is bad"
    }
  }]

  const getFindings = async () => findings;

  const updateFindings = jest.fn();

  await handle({
    getFindings,
    updateFindings,
    rules: rules,
  });

  expect(updateFindings).toBeCalledWith([
    {
      category: "Open Port",
      attributes: {
        hostname: "foobar.com",
        port: 23,
        state: "open"
      },
      severity: "high",
      description: "Telnet is bad"
    }
  ]);
});

test("Should Check Multiple 'anyOf'", async () => {
  const findings = [
    {
      category: "Open Port",
      attributes: {
        hostname: "foobar.com",
        port: 23,
        state: "open"
      },
    },
  ];

  const rules = [{
    matches: {
      anyOf: [
        {
          category: "Open Port",
          attributes: {
            port: 22,
            state: "open"
          }
        },
        {
          category: "Open Port",
          attributes: {
            port: 23,
            state: "open"
          }
        },
      ]
    },
    override: {
      severity: "high",
      description: "Telnet is bad"
    }
  }]

  const getFindings = async () => findings;

  const updateFindings = jest.fn();

  await handle({
    getFindings,
    updateFindings,
    rules: rules,
  });

  expect(updateFindings).toBeCalledWith([
    {
      category: "Open Port",
      attributes: {
        hostname: "foobar.com",
        port: 23,
        state: "open"
      },
      severity: "high",
      description: "Telnet is bad"
    }
  ]);
});

test("Should Ignore not Matching Conditions", async () => {
  const findings = [
    {
      category: "Open Port",
      attributes: {
        hostname: "foobar.com",
        port: 23,
        state: "open"
      },
    },
  ];

  const rules = [{
    matches: {
      anyOf: [
        {
          category: "Open Port",
          attributes: {
            port: 22,
            state: "open"
          }
        },
        {
          category: "Open Port",
          attributes: {
            port: 24,
            state: "open"
          }
        },
      ]
    },
    override: {
      severity: "high",
      description: "Telnet is bad"
    }
  }]

  const getFindings = async () => findings;

  const updateFindings = jest.fn();

  await handle({
    getFindings,
    updateFindings,
    rules: rules,
  });

  expect(updateFindings).toBeCalledWith([]);
});

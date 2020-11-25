/**
Copyright 2020 iteratec GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
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

  expect(updateFindings).not.toBeCalled();
});

test("Should Not Duplicate Findings For Multiple Matching Rules", async () => {
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

  const rules = [
    {
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
    },
    {
      matches: {
        anyOf: [
          {
            category: "Open Port",
            attributes: {
              state: "open"
            }
          },
        ]
      },
      override: {
        severity: "high",
        description: "Telnet is bad",
        ticket: "Issue #33"
      }
    }
  ]

  const getFindings = async () => findings;

  const updateFindings = jest.fn();

  await handle({
    getFindings,
    updateFindings,
    rules: rules,
  });

  const expected = [{
    category: "Open Port",
    attributes: {
      port: 23,
      hostname: "foobar.com",
      state: "open"
    },
    severity: "high",
    description: "Telnet is bad",
    ticket: "Issue #33"
  }]

  expect(updateFindings).toBeCalledWith(expected);

});

test("Should Update Nested Attributes", async () => {
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
      attributes: {
        hostname: "foo.bar",
        port: 42,
      },
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
        hostname: "foo.bar",
        port: 42,
        state: "open"
      },
      severity: "high",
      description: "Telnet is bad"
    }
  ]);

});

test("Should Not Update Findings If No Rule Matches", async () => {
  const findings = [
    {
      category: "Open Port",
      attributes: {
        hostname: "foobar.com",
        port: 22,
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
      attributes: {
        hostname: "foo.bar",
        port: 42,
      },
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

  expect(updateFindings).not.toBeCalled();
});

test("Should Ignore Findings That Don't Match The Rule", async () => {
  const findings = [
    {
      category: "Open Port",
      attributes: {
        hostname: "foo.com",
        port: 22,
        state: "open"
      },
    },
    {
      category: "Open Port",
      attributes: {
        hostname: "bar.com",
        port: 22,
        state: "open"
      },
    },
    {
      category: "Open Port",
      attributes: {
        hostname: "foobar.com",
        port: 22,
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
            hostname: "foobar.com",
            port: 22,
            state: "open"
          }
        },
      ]
    },
    override: {
      severity: "high",
      attributes: {
        port: 42,
      },
      description: "Foobar"
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
        hostname: "foo.com",
        port: 22,
        state: "open"
      },
    },
    {
      category: "Open Port",
      attributes: {
        hostname: "bar.com",
        port: 22,
        state: "open"
      },
    },
    {
      category: "Open Port",
      attributes: {
        hostname: "foobar.com",
        port: 42,
        state: "open"
      },
      severity: "high",
      description: "Foobar",
    }
  ]);

})

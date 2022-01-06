// SPDX-FileCopyrightText: 2022 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

process.env = Object.assign(process.env, {"MONITOR_WORKSPACE_ID": '123123', 
                                          "MONITOR_SHARED_KEY": "ffffffffffffffffffffffffffffff",
                                          "MONITOR_LOGTYPE_PREFIX": "SCB"});

const { handle } = require("./hook");

// Mock the fetch function
const fetch = jest.fn(x => new Promise((resolve, reject) => resolve({status: 200})));

beforeEach(() => {
  jest.clearAllMocks();
});

const scan = {
  metadata: {
    uid: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
    name: "demo-scan",
    labels: {
      company: "iteratec",
    },
  },
  spec: {
    scanType: "Nmap",
    parameters: ["-Pn", "localhost"],
  },
};

const testDate = new Date('2020-11-11');

test("should send findings to Azure Monitor", async () => {

  const findings = [
    {
      id: "4560b3e6-1219-4f5f-9b44-6579f5a32407",
      name: "Port 5601 is open",
      category: "Open Port",
    },
  ];

  const getFindings = async () => findings;

  await handle({getFindings,
                scan,
                workspaceId: "123123",
                sharedKey: "ffffffffffffffffffffffffffffff",
                logTypePrefix: "SCB",
                fetch: fetch,
                });

  expect(fetch).toBeCalledTimes(1);
});

test("should batch multiple findings in a single call", async () => {

  const findings = [
    {
      id: "4560b3e6-1219-4f5f-9b44-6579f5a32407",
      name: "Port 5601 is open",
      category: "Open Port",
    },
    {
      id: "4560b3e6-1219-4f5f-9b44-6579f5a32407",
      name: "Port 5601 is open",
      category: "Open Port",
    },
  ];

  const getFindings = async () => findings;

  await handle({getFindings,
                scan,
                workspaceId: "123123",
                sharedKey: "ffffffffffffffffffffffffffffff",
                logTypePrefix: "SCB",
                fetch: fetch,
                });

  expect(fetch).toBeCalledTimes(1);
});

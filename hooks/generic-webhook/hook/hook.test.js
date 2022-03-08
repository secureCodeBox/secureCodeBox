// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { handle } = require("./hook");
const axios = jest.createMockFromModule('axios')

beforeEach(() => {
  jest.clearAllMocks();
});

test("should send a post request to the url when fired", async () => {
  const findings = [];

  const getFindings = async () => findings;

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

  const webhookUrl = "http://example.com/foo/bar";

  await handle({ getFindings, scan, webhookUrl, axios });

  expect(axios.post).toBeCalledWith(webhookUrl, {
    scan,
    findings: [],
  });
});

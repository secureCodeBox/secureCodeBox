// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { handle } from "./hook";

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () => Promise.resolve(''),
  })
);

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

  await handle({ getFindings, scan, webhookUrl });

  expect(fetch).toHaveBeenCalledWith(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scan,
      findings: [],
    }),
  });
});

test("should include API key header when provided", async () => {
  const findings = [];
  const getFindings = async () => findings;
  const scan = { metadata: { name: "test-scan" } };
  const webhookUrl = "http://example.com/webhook";
  const webhookApikeyHeaderName = "X-API-Key";
  const webhookApikeyHeaderValue = "secret-api-key";

  await handle({
    getFindings,
    scan,
    webhookUrl,
    webhookApikeyHeaderName,
    webhookApikeyHeaderValue
  });

  expect(fetch).toHaveBeenCalledWith(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'secret-api-key',
    },
    body: JSON.stringify({
      scan,
      findings: [],
    }),
  });
});

test("should include basic auth when username and password are provided", async () => {
  const findings = [];
  const getFindings = async () => findings;
  const scan = { metadata: { name: "test-scan" } };
  const webhookUrl = "http://example.com/webhook";
  const webhookUser = "username";
  const webhookPassword = "password";
  
  // Base64 encoding of "username:password"
  const expectedAuthHeader = "Basic dXNlcm5hbWU6cGFzc3dvcmQ=";

  await handle({
    getFindings,
    scan,
    webhookUrl,
    webhookUser,
    webhookPassword
  });

  expect(fetch).toHaveBeenCalledWith(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': expectedAuthHeader,
    },
    body: JSON.stringify({
      scan,
      findings: [],
    }),
  });
});

test("should throw an error when the response is not ok", async () => {
  // Override the default mock to return a failed response
  global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    })
  );

  const findings = [];
  const getFindings = async () => findings;
  const scan = { metadata: { name: "test-scan" } };
  const webhookUrl = "http://example.com/webhook";

  await expect(handle({ getFindings, scan, webhookUrl }))
    .rejects
    .toThrow('Webhook request failed with status 500: Internal Server Error');
});

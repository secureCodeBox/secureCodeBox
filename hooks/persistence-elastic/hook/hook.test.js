// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { handle } from "./hook";

let elasticClient;
const buildGetFindings = (findings) => async () => findings;

beforeEach(() => {
  elasticClient = {
    indices: {
      create: jest.fn(),
    },
    index: jest.fn(),
    bulk: jest.fn(() => ({ body: {} })),
  };
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

const testDate = new Date("2020-11-11");

const scanDocumentBody = {
  "@timestamp": testDate,
  id: scan.metadata.uid,
  labels: scan.metadata.labels,
  name: scan.metadata.name,
  parameters: scan.spec.parameters,
  scan_type: scan.spec.scanType,
  type: "scan",
};

const expectScanIndexCalledWith = (index, client = elasticClient) => {
  expect(client.index).toHaveBeenCalledTimes(1);
  expect(client.index).toHaveBeenCalledWith({
    body: scanDocumentBody,
    index,
  });
};

const findingsWithOpenPort = [
  {
    id: "4560b3e6-1219-4f5f-9b44-6579f5a32407",
    name: "Port 5601 is open",
    category: "Open Port",
  },
];

test("should only send scan summary document if no findings are passing in", async () => {
  const findings = [];

  const getFindings = buildGetFindings(findings);

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    appendNamespace: true,
    client: elasticClient,
  });

  expectScanIndexCalledWith(`scb_default_2020-11-11`);
  expect(elasticClient.bulk).not.toHaveBeenCalled();
});

test("should send findings to elasticsearch with given prefix", async () => {
  const getFindings = buildGetFindings(findingsWithOpenPort);

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    indexPrefix: "myPrefix",
    appendNamespace: true,
    client: elasticClient,
  });

  expectScanIndexCalledWith(`myPrefix_default_2020-11-11`);

  expect(elasticClient.bulk).toHaveBeenCalledTimes(1);
  expect(elasticClient.bulk).toHaveBeenCalledWith({
    refresh: true,
    body: [
      {
        index: {
          _index: `myPrefix_default_2020-11-11`,
        },
      },
      {
        "@timestamp": testDate,
        category: "Open Port",
        id: "4560b3e6-1219-4f5f-9b44-6579f5a32407",
        name: "Port 5601 is open",
        scan_id: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
        scan_labels: {
          company: "iteratec",
        },
        scan_name: "demo-scan",
        scan_type: "Nmap",
        type: "finding",
      },
    ],
  });
});

test("should not append namespace if 'appendNamespace' is null", async () => {
  const findings = [];

  const getFindings = buildGetFindings(findings);

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    client: elasticClient,
  });

  expectScanIndexCalledWith(`scb_2020-11-11`);
});

test("should append date format yyyy", async () => {
  const findings = [];

  const getFindings = buildGetFindings(findings);

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    indexSuffix: "yyyy",
    client: elasticClient,
  });

  expectScanIndexCalledWith(`scb_2020`);
});

test("should append week format like yyyy/'W'W -> 2020/W46", async () => {
  const findings = [];

  const getFindings = buildGetFindings(findings);

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    indexSuffix: "yyyy/'W'W",
    client: elasticClient,
  });

  expectScanIndexCalledWith(`scb_2020/W46`);
});

test("should handle elasticsearch v8 bulk response shape", async () => {
  const findings = findingsWithOpenPort;
  const getFindings = buildGetFindings(findings);
  const v8BulkResponse = { errors: true, items: [] };

  const v8Client = {
    indices: {
      create: jest.fn(),
    },
    index: jest.fn(),
    bulk: jest.fn(() => v8BulkResponse),
  };

  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  try {
    await handle({
      getFindings,
      scan,
      now: testDate,
      tenant: "default",
      appendNamespace: true,
      client: v8Client,
    });
    expect(v8Client.bulk).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Bulk Request had errors:");
    expect(consoleLogSpy).toHaveBeenCalledWith(v8BulkResponse);
  } finally {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  }
});

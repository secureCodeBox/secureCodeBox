// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { handle } from "./hook";

let elasticClient;

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

test("should only send scan summary document if no findings are passing in", async () => {
  const findings = [];

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    appendNamespace: true,
    client: elasticClient,
  });

  expect(elasticClient.index).toHaveBeenCalledTimes(1);
  expect(elasticClient.index).toHaveBeenCalledWith({
    body: {
      "@timestamp": testDate,
      id: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      labels: {
        company: "iteratec",
      },
      name: "demo-scan",
      parameters: ["-Pn", "localhost"],
      scan_type: "Nmap",
      type: "scan",
    },
    index: `scb_default_2020-11-11`,
  });
  expect(elasticClient.bulk).not.toHaveBeenCalled();
});

test("should send findings to elasticsearch with given prefix", async () => {
  const findings = [
    {
      id: "4560b3e6-1219-4f5f-9b44-6579f5a32407",
      name: "Port 5601 is open",
      category: "Open Port",
    },
  ];

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    indexPrefix: "myPrefix",
    appendNamespace: true,
    client: elasticClient,
  });

  expect(elasticClient.index).toHaveBeenCalledTimes(1);
  expect(elasticClient.index).toHaveBeenCalledWith({
    body: {
      "@timestamp": testDate,
      id: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      labels: {
        company: "iteratec",
      },
      name: "demo-scan",
      parameters: ["-Pn", "localhost"],
      scan_type: "Nmap",
      type: "scan",
    },
    index: `myPrefix_default_2020-11-11`,
  });

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

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    client: elasticClient,
  });

  expect(elasticClient.index).toBeCalledTimes(1);
  expect(elasticClient.index).toBeCalledWith({
    body: {
      "@timestamp": testDate,
      id: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      labels: {
        company: "iteratec",
      },
      name: "demo-scan",
      parameters: ["-Pn", "localhost"],
      scan_type: "Nmap",
      type: "scan",
    },
    index: `scb_2020-11-11`,
  });
});

test("should append date format yyyy", async () => {
  const findings = [];

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    indexSuffix: "yyyy",
    client: elasticClient,
  });

  expect(elasticClient.index).toBeCalledTimes(1);
  expect(elasticClient.index).toBeCalledWith({
    body: {
      "@timestamp": testDate,
      id: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      labels: {
        company: "iteratec",
      },
      name: "demo-scan",
      parameters: ["-Pn", "localhost"],
      scan_type: "Nmap",
      type: "scan",
    },
    index: `scb_2020`,
  });
});

test("should append week format like yyyy/'W'W -> 2020/W46", async () => {
  const findings = [];

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    indexSuffix: "yyyy/'W'W",
    client: elasticClient,
  });

  expect(elasticClient.index).toBeCalledTimes(1);
  expect(elasticClient.index).toBeCalledWith({
    body: {
      "@timestamp": testDate,
      id: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      labels: {
        company: "iteratec",
      },
      name: "demo-scan",
      parameters: ["-Pn", "localhost"],
      scan_type: "Nmap",
      type: "scan",
    },
    index: `scb_2020/W46`,
  });
});

test("should handle Elasticsearch 8.x response format (without body wrapper)", async () => {
  const findings = [
    {
      id: "4560b3e6-1219-4f5f-9b44-6579f5a32407",
      name: "Port 5601 is open",
      category: "Open Port",
    },
  ];

  const getFindings = async () => findings;

  // ES 8.x returns response directly without .body wrapper
  const es8Client = {
    indices: {
      create: jest.fn(),
    },
    index: jest.fn(),
    bulk: jest.fn(() => ({ errors: false, items: [] })), // ES 8.x format
  };

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    appendNamespace: true,
    client: es8Client,
  });

  expect(es8Client.bulk).toHaveBeenCalledTimes(1);
  expect(es8Client.bulk).toHaveBeenCalledWith({
    refresh: true,
    body: [
      {
        index: {
          _index: `scb_default_2020-11-11`,
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

test("should handle Elasticsearch 7.x response format (with body wrapper)", async () => {
  const findings = [
    {
      id: "test-finding-id",
      name: "Test Finding",
      category: "Test Category",
    },
  ];

  const getFindings = async () => findings;

  // ES 7.x returns response with .body wrapper
  const es7Client = {
    indices: {
      create: jest.fn(),
    },
    index: jest.fn(),
    bulk: jest.fn(() => ({ body: { errors: false, items: [] } })), // ES 7.x format
  };

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    appendNamespace: true,
    client: es7Client,
  });

  expect(es7Client.bulk).toHaveBeenCalledTimes(1);
  expect(es7Client.bulk).toHaveBeenCalledWith({
    refresh: true,
    body: [
      {
        index: {
          _index: `scb_default_2020-11-11`,
        },
      },
      {
        "@timestamp": testDate,
        category: "Test Category",
        id: "test-finding-id",
        name: "Test Finding",
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

test("should handle bulk errors in Elasticsearch 8.x format", async () => {
  const findings = [
    {
      id: "error-finding",
      name: "Error Finding",
      category: "Error Category",
    },
  ];

  const getFindings = async () => findings;

  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

  // ES 8.x with errors
  const es8ClientWithErrors = {
    indices: {
      create: jest.fn(),
    },
    index: jest.fn(),
    bulk: jest.fn(() => ({
      errors: true,
      items: [
        {
          index: {
            error: {
              type: "mapper_parsing_exception",
              reason: "failed to parse field",
            },
          },
        },
      ],
    })),
  };

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    client: es8ClientWithErrors,
  });

  expect(consoleErrorSpy).toHaveBeenCalledWith("Bulk Request had errors:");
  expect(consoleLogSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      errors: true,
      items: expect.any(Array),
    }),
  );

  consoleErrorSpy.mockRestore();
  consoleLogSpy.mockRestore();
});

test("should handle bulk errors in Elasticsearch 7.x format", async () => {
  const findings = [
    {
      id: "error-finding",
      name: "Error Finding",
      category: "Error Category",
    },
  ];

  const getFindings = async () => findings;

  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

  // ES 7.x with errors
  const es7ClientWithErrors = {
    indices: {
      create: jest.fn(),
    },
    index: jest.fn(),
    bulk: jest.fn(() => ({
      body: {
        errors: true,
        items: [
          {
            index: {
              error: {
                type: "mapper_parsing_exception",
                reason: "failed to parse field",
              },
            },
          },
        ],
      },
    })),
  };

  await handle({
    getFindings,
    scan,
    now: testDate,
    tenant: "default",
    client: es7ClientWithErrors,
  });

  expect(consoleErrorSpy).toHaveBeenCalledWith("Bulk Request had errors:");
  expect(consoleLogSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      errors: true,
      items: expect.any(Array),
    }),
  );

  consoleErrorSpy.mockRestore();
  consoleLogSpy.mockRestore();
});

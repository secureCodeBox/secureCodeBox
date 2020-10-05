const { getCascadingScans } = require("./hook");

let parentScan = undefined;
let sslyzeCascadingRules = undefined;

beforeEach(() => {
  parentScan = {
    apiVersion: "execution.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      name: "nmap-foobar.com",
      annotations: {},
    },
    spec: {
      scanType: "nmap",
      parameters: "foobar.com",
      cascades: {},
    },
  };

  sslyzeCascadingRules = [
    {
      apiVersion: "cascading.securecodebox.io/v1",
      kind: "CascadingRule",
      metadata: {
        name: "tls-scans",
      },
      spec: {
        matches: {
          anyOf: [
            {
              category: "Open Port",
              attributes: {
                port: 443,
                service: "https",
              },
            },
            {
              category: "Open Port",
              attributes: {
                service: "https",
              },
            },
          ],
        },
        scanSpec: {
          scanType: "sslyze",
          parameters: ["--regular", "{{$.hostOrIP}}:{{attributes.port}}"],
        },
      },
    },
  ];
});

test("should create subsequent scans for open HTTPS ports (NMAP findings)", () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    Array [
      Object {
        "cascades": null,
        "generatedBy": "tls-scans",
        "name": "sslyze-foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "foobar.com:443",
        ],
        "scanType": "sslyze",
      },
    ]
  `);
});

test("Should create no subsequent scans if there are no rules", () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https",
      },
    },
  ];

  const cascadingRules = [];

  const cascadedScans = getCascadingScans(parentScan, findings, cascadingRules);

  expect(cascadedScans).toMatchInlineSnapshot(`Array []`);
});

test("should not try to do magic to the scan name if its something random", () => {
  parentScan.metadata.name = "foobar.com";

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: undefined,
        ip_address: "10.42.42.42",
        port: 443,
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    Array [
      Object {
        "cascades": null,
        "generatedBy": "tls-scans",
        "name": "foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "10.42.42.42:443",
        ],
        "scanType": "sslyze",
      },
    ]
  `);
});

test("should not start scan when the cascadingrule for it is already in the chain", () => {
  parentScan.metadata.annotations["cascading.securecodebox.io/chain"] =
    sslyzeCascadingRules[0].metadata.name;

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  expect(cascadedScans).toMatchInlineSnapshot(`Array []`);
});

test("should not crash when the annotations are not set", () => {
  parentScan.metadata.annotations = undefined;

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    Array [
      Object {
        "cascades": null,
        "generatedBy": "tls-scans",
        "name": "sslyze-foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "foobar.com:443",
        ],
        "scanType": "sslyze",
      },
    ]
  `);
});

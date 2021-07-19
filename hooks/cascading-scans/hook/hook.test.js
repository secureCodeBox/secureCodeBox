// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { getCascadingScanDefinition } = require("./scan-helpers");
const { getCascadingScans } = require("./hook");

let parentScan = undefined;
let sslyzeCascadingRules = undefined;

beforeEach(() => {
  parentScan = {
    apiVersion: "execution.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      name: "nmap-foobar.com",
      annotations: {}
    },
    spec: {
      scanType: "nmap",
      parameters: "foobar.com",
      cascades: {}
    }
  };

  sslyzeCascadingRules = [
    {
      apiVersion: "cascading.securecodebox.io/v1",
      kind: "CascadingRule",
      metadata: {
        name: "tls-scans"
      },
      spec: {
        matches: {
          anyOf: [
            {
              category: "Open Port",
              attributes: {
                port: 443,
                service: "https"
              }
            },
            {
              category: "Open Port",
              attributes: {
                service: "https"
              }
            }
          ]
        },
        scanSpec: {
          scanType: "sslyze",
          parameters: ["--regular", "{{$.hostOrIP}}:{{attributes.port}}"]
        }
      }
    }
  ];
});

test("Should create subsequent scans for open HTTPS ports (NMAP findings)", () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
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
        "env": undefined,
        "generatedBy": "tls-scans",
        "name": "sslyze-foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "foobar.com:443",
        ],
        "scanAnnotations": Object {},
        "scanLabels": Object {},
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
        service: "https"
      }
    }
  ];

  const cascadingRules = [];

  const cascadedScans = getCascadingScans(parentScan, findings, cascadingRules);

  expect(cascadedScans).toMatchInlineSnapshot(`Array []`);
});

test("Should not try to do magic to the scan name if its something random", () => {
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
        service: "https"
      }
    }
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
        "env": undefined,
        "generatedBy": "tls-scans",
        "name": "foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "10.42.42.42:443",
        ],
        "scanAnnotations": Object {},
        "scanLabels": Object {},
        "scanType": "sslyze",
      },
    ]
  `);
});

test("Should not start a new scan when the corresponding cascadingRule is already in the chain", () => {
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
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  expect(cascadedScans).toMatchInlineSnapshot(`Array []`);
});

test("Should not crash when the annotations are not set", () => {
  parentScan.metadata.annotations = undefined;

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
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
        "env": undefined,
        "generatedBy": "tls-scans",
        "name": "sslyze-foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "foobar.com:443",
        ],
        "scanAnnotations": Object {},
        "scanLabels": Object {},
        "scanType": "sslyze",
      },
    ]
  `);
});

test("Should copy ENV fields from cascadingRule to created scan", () => {
  sslyzeCascadingRules[0].spec.scanSpec.env = [
    {
      name: "FOOBAR",
      valueFrom: { secretKeyRef: { name: "foobar-token", key: "token" } }
    }
  ];

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
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
        "env": Array [
          Object {
            "name": "FOOBAR",
            "valueFrom": Object {
              "secretKeyRef": Object {
                "key": "token",
                "name": "foobar-token",
              },
            },
          },
        ],
        "generatedBy": "tls-scans",
        "name": "sslyze-foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "foobar.com:443",
        ],
        "scanAnnotations": Object {},
        "scanLabels": Object {},
        "scanType": "sslyze",
      },
    ]
  `);
});

test("Should allow wildcards in cascadingRules", () => {
  sslyzeCascadingRules = [
    {
      apiVersion: "cascading.securecodebox.io/v1",
      kind: "CascadingRule",
      metadata: {
        name: "tls-scans"
      },
      spec: {
        matches: {
          anyOf: [
            {
              category: "Open Port",
              attributes: {
                port: 8443,
                service: "https*"
              }
            }
          ]
        },
        scanSpec: {
          scanType: "sslyze",
          parameters: ["--regular", "{{$.hostOrIP}}:{{attributes.port}}"]
        }
      }
    }
  ];

  const findings = [
    {
      name: "Port 8443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 8443,
        service: "https-alt"
      }
    }
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
        "env": undefined,
        "generatedBy": "tls-scans",
        "name": "sslyze-foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "foobar.com:8443",
        ],
        "scanAnnotations": Object {},
        "scanLabels": Object {},
        "scanType": "sslyze",
      },
    ]
  `);
});

test("should not copy labels if inheritLabels is set to false", () => {
  parentScan.metadata.labels = {
    organization: "OWASP",
    location: "barcelona",
    vlan: "lan"
  };
  parentScan.spec.cascades.inheritLabels = false;

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  for (const { name, scanType, parameters, generatedBy, env, scanLabels, scanAnnotations } of cascadedScans) {
    const cascadingScanDefinition = getCascadingScanDefinition({
      name,
      parentScan: parentScan,
      generatedBy,
      scanType,
      parameters,
      env,
      scanLabels,
      scanAnnotations
    });

    expect(Object.entries(parentScan.metadata.labels).every(([label, value]) =>
      cascadingScanDefinition.metadata.labels[label] === value
    )).toBe(false)
  }
});

test("should copy labels if inheritLabels is not set", () => {
  parentScan.metadata.labels = {
    organization: "OWASP",
    location: "barcelona",
    vlan: "lan"
  };

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  for (const { name, scanType, parameters, generatedBy, env, scanLabels, scanAnnotations } of cascadedScans) {
    const cascadingScanDefinition = getCascadingScanDefinition({
      name,
      parentScan: parentScan,
      generatedBy,
      scanType,
      parameters,
      env,
      scanLabels,
      scanAnnotations
    });

    expect(Object.entries(parentScan.metadata.labels).every(([label, value]) =>
      cascadingScanDefinition.metadata.labels[label] === value
    )).toBe(true)
  }
});

test("should copy labels if inheritLabels is set to true", () => {
  parentScan.metadata.labels = {
    organization: "OWASP",
    location: "barcelona",
    vlan: "lan"
  };

  parentScan.spec.cascades.inheritLabels = true;

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  for (const { name, scanType, parameters, generatedBy, env, scanLabels, scanAnnotations } of cascadedScans) {
    const cascadingScanDefinition = getCascadingScanDefinition({
      name,
      parentScan: parentScan,
      generatedBy,
      scanType,
      parameters,
      env,
      scanLabels,
      scanAnnotations
    });

    expect(Object.entries(parentScan.metadata.labels).every(([label, value]) =>
      cascadingScanDefinition.metadata.labels[label] === value
    )).toBe(true)
  }
});

test("should not copy annotations if inheritAnnotations is set to false", () => {
  parentScan.metadata.annotations = {
    "defectdojo.securecodebox.io/product-name": "barcelona-network-sca",
    "defectdojo.securecodebox.io/engagement-name": "scb-automated-scan"
  };
  parentScan.spec.cascades.inheritAnnotations = false;

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  for (const { name, scanType, parameters, generatedBy, env, scanLabels, scanAnnotations } of cascadedScans) {
    const cascadingScanDefinition = getCascadingScanDefinition({
      name,
      parentScan: parentScan,
      generatedBy,
      scanType,
      parameters,
      env,
      scanLabels,
      scanAnnotations
    });

    expect(Object.entries(parentScan.metadata.annotations).every(([label, value]) =>
      cascadingScanDefinition.metadata.annotations[label] === value
    )).toBe(false)
  }
});

test("should copy annotations if inheritAnnotations is not set", () => {
  parentScan.metadata.annotations = {
    "defectdojo.securecodebox.io/product-name": "barcelona-network-sca",
    "defectdojo.securecodebox.io/engagement-name": "scb-automated-scan"
  };

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  for (const { name, scanType, parameters, generatedBy, env, scanLabels, scanAnnotations } of cascadedScans) {
    const cascadingScanDefinition = getCascadingScanDefinition({
      name,
      parentScan: parentScan,
      generatedBy,
      scanType,
      parameters,
      env,
      scanLabels,
      scanAnnotations
    });

    expect(Object.entries(parentScan.metadata.annotations).every(([label, value]) =>
      cascadingScanDefinition.metadata.annotations[label] === value
    )).toBe(true)
  }
});

test("should copy annotations if inheritAnnotations is set to true", () => {
  parentScan.metadata.annotations = {
    "defectdojo.securecodebox.io/product-name": "barcelona-network-sca",
    "defectdojo.securecodebox.io/engagement-name": "scb-automated-scan"
  };
  parentScan.spec.cascades.inheritAnnotations = true;

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  for (const { name, scanType, parameters, generatedBy, env, scanLabels, scanAnnotations } of cascadedScans) {
    const cascadingScanDefinition = getCascadingScanDefinition({
      name,
      parentScan: parentScan,
      generatedBy,
      scanType,
      parameters,
      env,
      scanLabels,
      scanAnnotations
    });

    expect(Object.entries(parentScan.metadata.annotations).every(([label, value]) =>
      cascadingScanDefinition.metadata.annotations[label] === value
    )).toBe(true)
  }
});

test("should copy scanLabels from CascadingRule to cascading scan", () => {
  sslyzeCascadingRules[0].spec.scanLabels = {
    k_one: "v_one",
    k_two: "v_two"
  }

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  const { name, scanType, parameters, generatedBy, env, scanLabels, scanAnnotations } = cascadedScans[0]

  expect(cascadedScans).toMatchInlineSnapshot(`
    Array [
      Object {
        "cascades": null,
        "env": undefined,
        "generatedBy": "tls-scans",
        "name": "sslyze-foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "foobar.com:443",
        ],
        "scanAnnotations": Object {},
        "scanLabels": Object {
          "k_one": "v_one",
          "k_two": "v_two",
        },
        "scanType": "sslyze",
      },
    ]
  `);

  const cascadingScanDefinition = getCascadingScanDefinition({
    name,
    parentScan: parentScan,
    generatedBy,
    scanType,
    parameters,
    env,
    scanLabels,
    scanAnnotations
  });

  expect(Object.entries(sslyzeCascadingRules[0].spec.scanLabels).every(([label, value]) =>
    cascadingScanDefinition.metadata.labels[label] === value
  )).toBe(true)
});

test("should copy scanAnnotations from CascadingRule to cascading scan", () => {
  sslyzeCascadingRules[0].spec.scanAnnotations = {
    k_one: "v_one",
    k_two: "v_two"
  }

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  const { name, scanType, parameters, generatedBy, env, scanLabels, scanAnnotations } = cascadedScans[0]

  expect(cascadedScans).toMatchInlineSnapshot(`
    Array [
      Object {
        "cascades": null,
        "env": undefined,
        "generatedBy": "tls-scans",
        "name": "sslyze-foobar.com-tls-scans",
        "parameters": Array [
          "--regular",
          "foobar.com:443",
        ],
        "scanAnnotations": Object {
          "k_one": "v_one",
          "k_two": "v_two",
        },
        "scanLabels": Object {},
        "scanType": "sslyze",
      },
    ]
  `);

  const cascadingScanDefinition = getCascadingScanDefinition({
    name,
    parentScan: parentScan,
    generatedBy,
    scanType,
    parameters,
    env,
    scanLabels,
    scanAnnotations
  });

  expect(Object.entries(sslyzeCascadingRules[0].spec.scanAnnotations).every(([label, value]) =>
    cascadingScanDefinition.metadata.annotations[label] === value
  )).toBe(true)
});

test("should properly parse template values in scanLabels and scanAnnotations", () => {
  sslyzeCascadingRules[0].spec.scanAnnotations = {
    k_one: "{{metadata.name}}",
    k_two: "{{metadata.unknown_property}}",
    k_three: "{{$.hostOrIP}}"
  }

  sslyzeCascadingRules[0].spec.scanLabels = {
    k_one: "{{metadata.name}}",
    k_two: "{{metadata.unknown_property}}",
    k_three: "{{$.hostOrIP}}"
  }

  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules
  );

  const { scanLabels, scanAnnotations } = cascadedScans[0]

  // No snapshots as scanLabels/scanAnnotations can be in any order
  const result = {
    "k_one": "nmap-foobar.com",
    "k_two": "",
    "k_three": "foobar.com",
  }

  expect(scanLabels).toEqual(result)

  expect(scanAnnotations).toEqual(result)
})


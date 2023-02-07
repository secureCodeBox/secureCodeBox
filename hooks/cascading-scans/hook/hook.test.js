// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {getCascadingScans} = require("./hook");
const {
  LabelSelectorRequirementOperator,
} = require("./kubernetes-label-selector");
const {ScopeLimiterRequirementOperator} = require("./scope-limiter");

let parentScan = undefined;
let sslyzeCascadingRules = undefined;
let parseDefinition = undefined;

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
  parseDefinition = {
    meta: {},
    spec: {
      scopeLimiterAliases: {},
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

test("Should create subsequent scans for open HTTPS ports (NMAP findings)", () => {
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
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    [
      {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": {
          "annotations": {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": {},
          "ownerReferences": [
            {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": {
          "affinity": undefined,
          "cascades": {},
          "env": [],
          "hookSelector": {},
          "initContainers": [],
          "parameters": [
            "--regular",
            "foobar.com:443",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": [],
          "volumes": [],
        },
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

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    cascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`[]`);
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
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans[0].metadata.generateName).toEqual(
    "foobar.com-tls-scans-"
  );
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
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`[]`);
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
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    [
      {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": {
          "annotations": {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": {},
          "ownerReferences": [
            {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": {
          "affinity": undefined,
          "cascades": {},
          "env": [],
          "hookSelector": {},
          "initContainers": [],
          "parameters": [
            "--regular",
            "foobar.com:443",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": [],
          "volumes": [],
        },
      },
    ]
  `);
});

test("Should copy ENV fields from cascadingRule to created scan", () => {
  sslyzeCascadingRules[0].spec.scanSpec.env = [
    {
      name: "FOOBAR",
      valueFrom: {secretKeyRef: {name: "foobar-token", key: "token"}},
    },
  ];

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
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans[0].spec.env).toMatchInlineSnapshot(`
    [
      {
        "name": "FOOBAR",
        "valueFrom": {
          "secretKeyRef": {
            "key": "token",
            "name": "foobar-token",
          },
        },
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
        name: "tls-scans",
      },
      spec: {
        matches: {
          anyOf: [
            {
              category: "Open Port",
              attributes: {
                port: 8443,
                service: "https*",
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

  const findings = [
    {
      name: "Port 8443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 8443,
        service: "https-alt",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    [
      {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": {
          "annotations": {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": {},
          "ownerReferences": [
            {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": {
          "affinity": undefined,
          "cascades": {},
          "env": [],
          "hookSelector": {},
          "initContainers": [],
          "parameters": [
            "--regular",
            "foobar.com:8443",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": [],
          "volumes": [],
        },
      },
    ]
  `);
});

test("should not copy labels if inheritLabels is set to false", () => {
  parentScan.metadata.labels = {
    organization: "OWASP",
    location: "barcelona",
    vlan: "lan",
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
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  for (const cascadedScan of cascadedScans) {
    expect(
      Object.entries(parentScan.metadata.labels).every(
        ([label, value]) => cascadedScan.metadata.labels[label] === value
      )
    ).toBe(false);
  }
});

test("should copy labels if inheritLabels is not set", () => {
  parentScan.metadata.labels = {
    organization: "OWASP",
    location: "barcelona",
    vlan: "lan",
  };

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
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  for (const cascadedScan of cascadedScans) {
    expect(
      Object.entries(parentScan.metadata.labels).every(
        ([label, value]) => cascadedScan.metadata.labels[label] === value
      )
    ).toBe(true);
  }
});

test("should copy labels if inheritLabels is set to true", () => {
  parentScan.metadata.labels = {
    organization: "OWASP",
    location: "barcelona",
    vlan: "lan",
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
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  for (const cascadedScan of cascadedScans) {
    expect(
      Object.entries(parentScan.metadata.labels).every(
        ([label, value]) => cascadedScan.metadata.labels[label] === value
      )
    ).toBe(true);
  }
});

test("should not copy annotations if inheritAnnotations is set to false", () => {
  parentScan.metadata.annotations = {
    "defectdojo.securecodebox.io/product-name": "barcelona-network-sca",
    "defectdojo.securecodebox.io/engagement-name": "scb-automated-scan",
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
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  for (const cascadedScan of cascadedScans) {
    expect(
      Object.entries(parentScan.metadata.annotations).every(
        ([label, value]) => cascadedScan.metadata.annotations[label] === value
      )
    ).toBe(false);
  }
});

test("should copy annotations if inheritAnnotations is not set", () => {
  parentScan.metadata.annotations = {
    "defectdojo.securecodebox.io/product-name": "barcelona-network-sca",
    "defectdojo.securecodebox.io/engagement-name": "scb-automated-scan",
  };

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
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  for (const cascadedScan of cascadedScans) {
    expect(
      Object.entries(parentScan.metadata.annotations).every(
        ([label, value]) => cascadedScan.metadata.annotations[label] === value
      )
    ).toBe(true);
  }
});

test("should copy annotations if inheritAnnotations is set to true", () => {
  parentScan.metadata.annotations = {
    "defectdojo.securecodebox.io/product-name": "barcelona-network-sca",
    "defectdojo.securecodebox.io/engagement-name": "scb-automated-scan",
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
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  for (const cascadedScan of cascadedScans) {
    expect(
      Object.entries(parentScan.metadata.annotations).every(
        ([label, value]) => cascadedScan.metadata.annotations[label] === value
      )
    ).toBe(true);
  }
});

test("should copy scanLabels from CascadingRule to cascading scan", () => {
  sslyzeCascadingRules[0].spec.scanLabels = {
    k_one: "v_one",
    k_two: "v_two",
  };

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
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];
  expect(
    Object.entries(sslyzeCascadingRules[0].spec.scanLabels).every(
      ([label, value]) => cascadedScan.metadata.labels[label] === value
    )
  ).toBe(true);
});

test("should copy scanAnnotations from CascadingRule to cascading scan", () => {
  sslyzeCascadingRules[0].spec.scanAnnotations = {
    k_one: "v_one",
    k_two: "v_two",
  };

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
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];
  expect(
    Object.entries(sslyzeCascadingRules[0].spec.scanAnnotations).every(
      ([label, value]) => cascadedScan.metadata.annotations[label] === value
    )
  ).toBe(true);
});

test("should properly parse template values in scanLabels and scanAnnotations", () => {
  sslyzeCascadingRules[0].spec.scanAnnotations = {
    k_one: "{{metadata.name}}",
    k_two: "{{metadata.unknown_property}}",
    k_three: "{{$.hostOrIP}}",
  };

  sslyzeCascadingRules[0].spec.scanLabels = {
    k_one: "{{metadata.name}}",
    k_two: "{{metadata.unknown_property}}",
    k_three: "{{$.hostOrIP}}",
  };

  const findings = [
    {
      name: "Port 8443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 8443,
        service: "https",
      },
    },
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
    sslyzeCascadingRules,
    sslyzeCascadingRules[0],
    parseDefinition
  );

  expect(sslyzeCascadingRules[0].spec.scanSpec.parameters).toEqual([
    "--regular",
    "{{$.hostOrIP}}:{{attributes.port}}",
  ]);

  const {labels, annotations} = cascadedScans[0].metadata;

  // No snapshots as scanLabels/scanAnnotations can be in any order
  const labelResults = {
    k_one: "nmap-foobar.com",
    k_two: "",
    k_three: "foobar.com",
  };

  expect(labels).toEqual(labelResults);

  const annotationsResults = {
    "cascading.securecodebox.io/chain": "tls-scans",
    "cascading.securecodebox.io/matched-finding": undefined,
    "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
    "securecodebox.io/hook": "cascading-scans",
    k_one: "nmap-foobar.com",
    k_two: "",
    k_three: "foobar.com",
  };

  expect(annotations).toEqual(annotationsResults);
});

test("should copy proper finding ID into annotations", () => {
  const findings = [
    {
      name: "Port 12345 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 12345,
        service: "unknown",
      },
      id: "random-id",
    },
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https",
      },
      id: "f0c718bd-9987-42c8-2259-73794e61dd5a",
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];
  expect(
    Object.entries(cascadedScan.metadata.annotations).every(
      ([label, value]) => {
        if (label === "cascading.securecodebox.io/matched-finding") {
          return value === "f0c718bd-9987-42c8-2259-73794e61dd5a";
        } else return true;
      }
    )
  ).toBe(true);
});

test("should merge environment variables into cascaded scan", () => {
  parentScan.spec.cascades.inheritEnv = true;
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

  parentScan.spec.env = [
    {
      name: "parent_environment_variable_name",
      value: "parent_environment_variable_value",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.env = [
    {
      name: "rule_environment_variable_name",
      value: "rule_environment_variable_value",
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];
  expect(cascadedScan.spec.env).toMatchInlineSnapshot(`
    [
      {
        "name": "parent_environment_variable_name",
        "value": "parent_environment_variable_value",
      },
      {
        "name": "rule_environment_variable_name",
        "value": "rule_environment_variable_value",
      },
    ]
  `);
});

test("should merge volumeMounts into cascaded scan", () => {
  parentScan.spec.cascades.inheritVolumes = true;
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

  parentScan.spec.volumeMounts = [
    {
      mountPath: "/etc/ssl/certs/ca-cert.cer",
      name: "ca-certificate",
      readOnly: true,
      subPath: "ca-cert.cer",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.volumeMounts = [
    {
      mountPath: "/etc/ssl/certs/ca-cert-sslyze.cer",
      name: "ca-certificate-sslyze",
      readOnly: true,
      subPath: "ca-cert-sslyze.cer",
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];
  expect(cascadedScan.spec.volumeMounts).toMatchInlineSnapshot(`
    [
      {
        "mountPath": "/etc/ssl/certs/ca-cert.cer",
        "name": "ca-certificate",
        "readOnly": true,
        "subPath": "ca-cert.cer",
      },
      {
        "mountPath": "/etc/ssl/certs/ca-cert-sslyze.cer",
        "name": "ca-certificate-sslyze",
        "readOnly": true,
        "subPath": "ca-cert-sslyze.cer",
      },
    ]
  `);
});

test("should merge volumes into cascaded scan", () => {
  parentScan.spec.cascades.inheritVolumes = true;
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

  parentScan.spec.volumes = [
    {
      name: "ca-certificate",
      configMap: {
        name: "ca-certificate",
      },
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.volumes = [
    {
      name: "ca-certificate-sslyze",
      configMap: {
        name: "ca-certificate-sslyze",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  expect(cascadedScan.spec.volumes).toMatchInlineSnapshot(`
    [
      {
        "configMap": {
          "name": "ca-certificate",
        },
        "name": "ca-certificate",
      },
      {
        "configMap": {
          "name": "ca-certificate-sslyze",
        },
        "name": "ca-certificate-sslyze",
      },
    ]
  `);
});

test("should merge initContainers into cascaded scan", () => {
  parentScan.spec.cascades.inheritInitContainers = true;
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

  parentScan.spec.initContainers = [
    {
      name: "test-init",
      image: "bitnami/git",
      command: ["whoami"],
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.initContainers = [
    {
      name: "test-init-2",
      image: "some/hypothetical",
      command: ["echo", "1"],
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  expect(cascadedScan.spec.initContainers).toMatchInlineSnapshot(`
    [
      {
        "command": [
          "whoami",
        ],
        "image": "bitnami/git",
        "name": "test-init",
      },
      {
        "command": [
          "echo",
          "1",
        ],
        "image": "some/hypothetical",
        "name": "test-init-2",
      },
    ]
  `);
});

test("should not merge initContainers into cascaded scan if not instructed", () => {
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

  parentScan.spec.initContainers = [
    {
      name: "test-init",
      image: "bitnami/git",
      command: ["whoami"],
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.initContainers = [
    {
      name: "test-init-2",
      image: "some/hypothetical",
      command: ["echo", "1"],
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  expect(cascadedScan.spec.initContainers).toMatchInlineSnapshot(`
    [
      {
        "command": [
          "echo",
          "1",
        ],
        "image": "some/hypothetical",
        "name": "test-init-2",
      },
    ]
  `);
});

test("Templating should apply to environment variables", () => {
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
          volumes: [{name: "test-volume", emptyDir: {}}],
          volumeMounts: [{name: "test-volume", mountPath: "/test"}],
          env: [{name: "HostOrIp", value: "{{$.hostOrIP}}"}],
        },
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    [
      {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": {
          "annotations": {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": {},
          "ownerReferences": [
            {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": {
          "affinity": undefined,
          "cascades": {},
          "env": [
            {
              "name": "HostOrIp",
              "value": "foobar.com",
            },
          ],
          "hookSelector": {},
          "initContainers": [],
          "parameters": [
            "--regular",
            "foobar.com:443",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": [
            {
              "mountPath": "/test",
              "name": "test-volume",
            },
          ],
          "volumes": [
            {
              "emptyDir": {},
              "name": "test-volume",
            },
          ],
        },
      },
    ]
  `);
});

test("Templating should apply to initContainer commands", () => {
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
          volumes: [{name: "test-volume", emptyDir: {}}],
          volumeMounts: [{name: "test-volume", mountPath: "/test"}],
          initContainers: [
            {
              name: "ping-it-again",
              image: "busybox",
              command: ["ping", "-c", "1", "{{$.hostOrIP}}"],
              volumeMounts: [{name: "test-volume", mountPath: "/test"}],
            },
          ],
        },
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    [
      {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": {
          "annotations": {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": {},
          "ownerReferences": [
            {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": {
          "affinity": undefined,
          "cascades": {},
          "env": [],
          "hookSelector": {},
          "initContainers": [
            {
              "command": [
                "ping",
                "-c",
                "1",
                "foobar.com",
              ],
              "image": "busybox",
              "name": "ping-it-again",
              "volumeMounts": [
                {
                  "mountPath": "/test",
                  "name": "test-volume",
                },
              ],
            },
          ],
          "parameters": [
            "--regular",
            "foobar.com:443",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": [
            {
              "mountPath": "/test",
              "name": "test-volume",
            },
          ],
          "volumes": [
            {
              "emptyDir": {},
              "name": "test-volume",
            },
          ],
        },
      },
    ]
  `);
});

test("Templating should apply to initContainer environment variables", () => {
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
          volumes: [{name: "test-volume", emptyDir: {}}],
          volumeMounts: [{name: "test-volume", mountPath: "/test"}],
          initContainers: [
            {
              name: "ping-it-again",
              image: "busybox",
              command: ["whoami"],
              volumeMounts: [{name: "test-volume", mountPath: "/test"}],
              env: [{name: "HostOrIp", value: "{{$.hostOrIP}}"}],
            },
          ],
        },
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    [
      {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": {
          "annotations": {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": {},
          "ownerReferences": [
            {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": {
          "affinity": undefined,
          "cascades": {},
          "env": [],
          "hookSelector": {},
          "initContainers": [
            {
              "command": [
                "whoami",
              ],
              "env": [
                {
                  "name": "HostOrIp",
                  "value": "foobar.com",
                },
              ],
              "image": "busybox",
              "name": "ping-it-again",
              "volumeMounts": [
                {
                  "mountPath": "/test",
                  "name": "test-volume",
                },
              ],
            },
          ],
          "parameters": [
            "--regular",
            "foobar.com:443",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": [
            {
              "mountPath": "/test",
              "name": "test-volume",
            },
          ],
          "volumes": [
            {
              "emptyDir": {},
              "name": "test-volume",
            },
          ],
        },
      },
    ]
  `);
});

test("Templating should not break special encoding (http://...) when using triple-mustache {{{}}}", () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "https://github.com/secureCodeBox/secureCodeBox",
        port: 443,
        service: "https",
      },
    },
  ];

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
          parameters: ["--regular", "{{{attributes.hostname}}}"],
          volumes: [{name: "test-volume", emptyDir: {}}],
          volumeMounts: [{name: "test-volume", mountPath: "/test"}],
          initContainers: [
            {
              name: "ping-it-again",
              image: "busybox",
              command: ["ping", "-c", "1", "{{{attributes.hostname}}}"],
              volumeMounts: [{name: "test-volume", mountPath: "/test"}],
            },
          ],
        },
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    [
      {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": {
          "annotations": {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": {},
          "ownerReferences": [
            {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": {
          "affinity": undefined,
          "cascades": {},
          "env": [],
          "hookSelector": {},
          "initContainers": [
            {
              "command": [
                "ping",
                "-c",
                "1",
                "https://github.com/secureCodeBox/secureCodeBox",
              ],
              "image": "busybox",
              "name": "ping-it-again",
              "volumeMounts": [
                {
                  "mountPath": "/test",
                  "name": "test-volume",
                },
              ],
            },
          ],
          "parameters": [
            "--regular",
            "https://github.com/secureCodeBox/secureCodeBox",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": [
            {
              "mountPath": "/test",
              "name": "test-volume",
            },
          ],
          "volumes": [
            {
              "emptyDir": {},
              "name": "test-volume",
            },
          ],
        },
      },
    ]
  `);
});

test("should merge hookSelector into cascaded scan if inheritHookSelector is enabled", () => {
  parentScan.spec.cascades.inheritHookSelector = true;
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

  parentScan.spec.hookSelector = {};
  parentScan.spec.hookSelector.matchLabels = {
    "securecodebox.io/internal": "true",
  };
  parentScan.spec.hookSelector.matchExpressions = [
    {
      key: "securecodebox.io/name",
      operator: LabelSelectorRequirementOperator.In,
      values: ["cascading-scans"],
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.hookSelector = {};
  sslyzeCascadingRules[0].spec.scanSpec.hookSelector.matchExpressions = [
    {
      key: "securecodebox.io/name",
      operator: LabelSelectorRequirementOperator.NotIn,
      values: ["cascading-scans"],
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.hookSelector.matchLabels = {
    "securecodebox.io/internal": "false",
  };

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  expect(cascadedScan.spec.hookSelector).toMatchInlineSnapshot(`
    {
      "matchExpressions": [
        {
          "key": "securecodebox.io/name",
          "operator": "In",
          "values": [
            "cascading-scans",
          ],
        },
        {
          "key": "securecodebox.io/name",
          "operator": "NotIn",
          "values": [
            "cascading-scans",
          ],
        },
      ],
      "matchLabels": {
        "securecodebox.io/internal": "false",
      },
    }
  `);
});

test("should not merge hookSelector into cascaded scan if inheritHookSelector is disabled", () => {
  parentScan.spec.cascades.inheritHookSelector = false;
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

  parentScan.spec.hookSelector = {};
  parentScan.spec.hookSelector.matchLabels = {
    "securecodebox.io/internal": "true",
  };
  parentScan.spec.hookSelector.matchExpressions = [
    {
      key: "securecodebox.io/name",
      operator: LabelSelectorRequirementOperator.In,
      values: ["cascading-scans"],
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.hookSelector = {};
  sslyzeCascadingRules[0].spec.scanSpec.hookSelector.matchExpressions = [
    {
      key: "securecodebox.io/name",
      operator: LabelSelectorRequirementOperator.NotIn,
      values: ["cascading-scans"],
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.hookSelector.matchLabels = {
    "securecodebox.io/internal": "false",
  };

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  expect(cascadedScan.spec.hookSelector).toMatchInlineSnapshot(`
    {
      "matchExpressions": [
        {
          "key": "securecodebox.io/name",
          "operator": "NotIn",
          "values": [
            "cascading-scans",
          ],
        },
      ],
      "matchLabels": {
        "securecodebox.io/internal": "false",
      },
    }
  `);
});

test("should copy tolerations and affinity into cascaded scan if one is set and label is unset", () => {
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

  parentScan.spec.affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: "disktype",
                operator: "In",
                values: ["ssd"],
              },
            ],
          },
        ],
      },
    },
  };

  parentScan.spec.tolerations = [
    {
      key: "key1",
      operator: "Equal",
      value: "test",
      effect: "NoSchedule",
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  expect(cascadedScan.spec.affinity).toMatchInlineSnapshot(`
    {
      "nodeAffinity": {
        "requiredDuringSchedulingIgnoredDuringExecution": {
          "nodeSelectorTerms": [
            {
              "matchExpressions": [
                {
                  "key": "disktype",
                  "operator": "In",
                  "values": [
                    "ssd",
                  ],
                },
              ],
            },
          ],
        },
      },
    }
  `);

  expect(cascadedScan.spec.tolerations).toMatchInlineSnapshot(`
    [
      {
        "effect": "NoSchedule",
        "key": "key1",
        "operator": "Equal",
        "value": "test",
      },
    ]
  `);
});

test("should not copy tolerations and affinity into cascaded scan if label disables it", () => {
  parentScan.spec.cascades.inheritAffinity = false;
  parentScan.spec.cascades.inheritTolerations = false;
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

  parentScan.spec.affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: "disktype",
                operator: "In",
                values: ["ssd"],
              },
            ],
          },
        ],
      },
    },
  };

  parentScan.spec.tolerations = [
    {
      key: "key1",
      operator: "Equal",
      value: "test",
      effect: "NoSchedule",
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  expect(cascadedScan.spec.affinity).toMatchInlineSnapshot(`undefined`);

  expect(cascadedScan.spec.tolerations).toMatchInlineSnapshot(`undefined`);
});

test("should merge tolerations and replace affinity in cascaded scan if cascading spec sets new ones", () => {
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

  parentScan.spec.affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: "disktype",
                operator: "In",
                values: ["ssd"],
              },
            ],
          },
        ],
      },
    },
  };

  parentScan.spec.tolerations = [
    {
      key: "key1",
      operator: "Equal",
      value: "test",
      effect: "NoSchedule",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.tolerations = [
    {
      key: "key2",
      operator: "Equal",
      value: "test-2",
      effect: "NoSchedule",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: "network",
                operator: "In",
                values: ["10g"],
              },
            ],
          },
        ],
      },
    },
  };

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  // New values will completely replace the old values, not be merged
  expect(cascadedScan.spec.affinity).toMatchInlineSnapshot(`
    {
      "nodeAffinity": {
        "requiredDuringSchedulingIgnoredDuringExecution": {
          "nodeSelectorTerms": [
            {
              "matchExpressions": [
                {
                  "key": "network",
                  "operator": "In",
                  "values": [
                    "10g",
                  ],
                },
              ],
            },
          ],
        },
      },
    }
  `);

  expect(cascadedScan.spec.tolerations).toMatchInlineSnapshot(`
    [
      {
        "effect": "NoSchedule",
        "key": "key1",
        "operator": "Equal",
        "value": "test",
      },
      {
        "effect": "NoSchedule",
        "key": "key2",
        "operator": "Equal",
        "value": "test-2",
      },
    ]
  `);
});

test("should not set affinity or tolerations to undefined if they are defined to be an empty map / list in upstream scan", () => {
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

  parentScan.spec.affinity = {};

  parentScan.spec.tolerations = [];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  // New values will completely replace the old values, not be merged
  expect(cascadedScan.spec.affinity).toMatchInlineSnapshot(`{}`);

  expect(cascadedScan.spec.tolerations).toMatchInlineSnapshot(`[]`);
});

test("Should not set affinity or tolerations to undefined if they are defined to be an empty map / list in cascading ScanSpec", () => {
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

  sslyzeCascadingRules[0].spec.scanSpec.tolerations = [];

  sslyzeCascadingRules[0].spec.scanSpec.affinity = {};

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  // New values will completely replace the old values, not be merged
  expect(cascadedScan.spec.affinity).toMatchInlineSnapshot(`{}`);

  expect(cascadedScan.spec.tolerations).toMatchInlineSnapshot(`[]`);
});

test("should only use tolerations and affinity of cascaded scan if inheritance is disabled", () => {
  parentScan.spec.cascades.inheritAffinity = false;
  parentScan.spec.cascades.inheritTolerations = false;
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

  parentScan.spec.affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: "disktype",
                operator: "In",
                values: ["ssd"],
              },
            ],
          },
        ],
      },
    },
  };

  parentScan.spec.tolerations = [
    {
      key: "key1",
      operator: "Equal",
      value: "test",
      effect: "NoSchedule",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.tolerations = [
    {
      key: "key2",
      operator: "Equal",
      value: "test-2",
      effect: "NoSchedule",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: "network",
                operator: "In",
                values: ["10g"],
              },
            ],
          },
        ],
      },
    },
  };

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  expect(cascadedScan.spec.affinity).toMatchInlineSnapshot(`
    {
      "nodeAffinity": {
        "requiredDuringSchedulingIgnoredDuringExecution": {
          "nodeSelectorTerms": [
            {
              "matchExpressions": [
                {
                  "key": "network",
                  "operator": "In",
                  "values": [
                    "10g",
                  ],
                },
              ],
            },
          ],
        },
      },
    }
  `);

  expect(cascadedScan.spec.tolerations).toMatchInlineSnapshot(`
    [
      {
        "effect": "NoSchedule",
        "key": "key2",
        "operator": "Equal",
        "value": "test-2",
      },
    ]
  `);
});

test("should purge cascaded scan spec from parent scan", () => {
  parentScan.spec.cascades.inheritEnv = true;
  parentScan.spec.cascades.inheritVolumes = true;
  parentScan.spec.cascades.inheritHookSelector = true;
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

  parentScan.spec.volumes = [
    {
      name: "ca-certificate",
      configMap: {
        name: "ca-certificate",
      },
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.volumes = [
    {
      name: "ca-certificate-sslyze",
      configMap: {
        name: "ca-certificate-sslyze",
      },
    },
  ];

  parentScan.spec.volumeMounts = [
    {
      mountPath: "/etc/ssl/certs/ca-cert.cer",
      name: "ca-certificate",
      readOnly: true,
      subPath: "ca-cert.cer",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.volumeMounts = [
    {
      mountPath: "/etc/ssl/certs/ca-cert-sslyze.cer",
      name: "ca-certificate-sslyze",
      readOnly: true,
      subPath: "ca-cert-sslyze.cer",
    },
  ];

  parentScan.spec.env = [
    {
      name: "parent_environment_variable_name",
      value: "parent_environment_variable_value",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.env = [
    {
      name: "rule_environment_variable_name",
      value: "rule_environment_variable_value",
    },
  ];

  parentScan.spec.hookSelector = {};
  parentScan.spec.hookSelector.matchLabels = {
    "securecodebox.io/internal": "true",
  };
  parentScan.spec.hookSelector.matchExpressions = [
    {
      key: "securecodebox.io/name",
      operator: LabelSelectorRequirementOperator.In,
      values: ["cascading-scans"],
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.hookSelector = {};
  sslyzeCascadingRules[0].spec.scanSpec.hookSelector.matchExpressions = [
    {
      key: "securecodebox.io/name",
      operator: LabelSelectorRequirementOperator.NotIn,
      values: ["cascading-scans"],
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.hookSelector.matchLabels = {
    "securecodebox.io/internal": "false",
  };

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];

  // Create a second cascading rule
  sslyzeCascadingRules[1] = {
    apiVersion: "cascading.securecodebox.io/v1",
    kind: "CascadingRule",
    metadata: {
      name: "tls-scans-second",
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
  };

  cascadedScan.metadata.name = cascadedScan.metadata.generateName;

  const secondCascadedScans = getCascadingScans(
    cascadedScan,
    findings,
    sslyzeCascadingRules,
    sslyzeCascadingRules[0], // cascaded rule on parent
    parseDefinition
  );

  const secondCascadedScan = secondCascadedScans[0];

  expect(secondCascadedScan.spec.env).toMatchInlineSnapshot(`
    [
      {
        "name": "parent_environment_variable_name",
        "value": "parent_environment_variable_value",
      },
    ]
  `);

  expect(secondCascadedScan.spec.volumes).toMatchInlineSnapshot(`
    [
      {
        "configMap": {
          "name": "ca-certificate",
        },
        "name": "ca-certificate",
      },
    ]
  `);

  expect(secondCascadedScan.spec.volumeMounts).toMatchInlineSnapshot(`
    [
      {
        "mountPath": "/etc/ssl/certs/ca-cert.cer",
        "name": "ca-certificate",
        "readOnly": true,
        "subPath": "ca-cert.cer",
      },
    ]
  `);

  expect(secondCascadedScan.spec.hookSelector.matchExpressions)
    .toMatchInlineSnapshot(`
    [
      {
        "key": "securecodebox.io/name",
        "operator": "In",
        "values": [
          "cascading-scans",
        ],
      },
    ]
  `);
  expect(
    secondCascadedScan.spec.hookSelector.matchLabels
  ).toMatchInlineSnapshot(`{}`);
});

test("should not copy cascaded scan spec from parent scan if inheritance is undefined", () => {
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

  parentScan.spec.volumes = [
    {
      name: "ca-certificate",
      configMap: {
        name: "ca-certificate",
      },
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.volumes = [
    {
      name: "ca-certificate-sslyze",
      configMap: {
        name: "ca-certificate-sslyze",
      },
    },
  ];

  parentScan.spec.volumeMounts = [
    {
      mountPath: "/etc/ssl/certs/ca-cert.cer",
      name: "ca-certificate",
      readOnly: true,
      subPath: "ca-cert.cer",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.volumeMounts = [
    {
      mountPath: "/etc/ssl/certs/ca-cert-sslyze.cer",
      name: "ca-certificate-sslyze",
      readOnly: true,
      subPath: "ca-cert-sslyze.cer",
    },
  ];

  parentScan.spec.env = [
    {
      name: "parent_environment_variable_name",
      value: "parent_environment_variable_value",
    },
  ];

  sslyzeCascadingRules[0].spec.scanSpec.env = [
    {
      name: "rule_environment_variable_name",
      value: "rule_environment_variable_value",
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];
  // Create a second cascading rule
  sslyzeCascadingRules[1] = {
    apiVersion: "cascading.securecodebox.io/v1",
    kind: "CascadingRule",
    metadata: {
      name: "tls-scans-second",
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
  };

  cascadedScan.metadata.name = cascadedScan.metadata.generateName;

  const secondCascadedScans = getCascadingScans(
    cascadedScan,
    findings,
    sslyzeCascadingRules,
    sslyzeCascadingRules[0], // cascaded rule on parent
    parseDefinition
  );

  const secondCascadedScan = secondCascadedScans[0];

  expect(secondCascadedScan.spec.env).toMatchInlineSnapshot(`[]`);

  expect(secondCascadedScan.spec.volumes).toMatchInlineSnapshot(`[]`);

  expect(secondCascadedScan.spec.volumeMounts).toMatchInlineSnapshot(`[]`);
});

test("should append cascading rule to further cascading scan chains", () => {
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
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  const cascadedScan = cascadedScans[0];
  // Create a second cascading rule
  sslyzeCascadingRules[1] = {
    apiVersion: "cascading.securecodebox.io/v1",
    kind: "CascadingRule",
    metadata: {
      name: "tls-scans-second",
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
  };

  cascadedScan.metadata.name = cascadedScan.metadata.generateName;

  const secondCascadedScans = getCascadingScans(
    cascadedScan,
    findings,
    sslyzeCascadingRules,
    sslyzeCascadingRules[0], // cascaded rule on parent
    parseDefinition
  );

  const secondCascadedScan = secondCascadedScans[0];

  expect(
    secondCascadedScan.metadata.annotations["cascading.securecodebox.io/chain"]
  ).toEqual("tls-scans,tls-scans-second");
});

test("should not cascade if scope limiter does not pass", () => {
  parentScan.metadata.annotations["scope.cascading.securecodebox.io/ports"] =
    "80,443";
  parentScan.spec.cascades.scopeLimiter = {
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/ports",
        operator: ScopeLimiterRequirementOperator.Contains,
        values: ["{{$.port}}"],
      },
    ],
  };

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
    {
      name: "Port 8080 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 8080,
        service: "https",
      },
    },
  ];

  parseDefinition.spec.scopeLimiterAliases["port"] = "{{attributes.port}}";

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    [
      {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": {
          "annotations": {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "scope.cascading.securecodebox.io/ports": "80,443",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": {},
          "ownerReferences": [
            {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": {
          "affinity": undefined,
          "cascades": {
            "scopeLimiter": {
              "allOf": [
                {
                  "key": "scope.cascading.securecodebox.io/ports",
                  "operator": "Contains",
                  "values": [
                    "{{$.port}}",
                  ],
                },
              ],
            },
          },
          "env": [],
          "hookSelector": {},
          "initContainers": [],
          "parameters": [
            "--regular",
            "foobar.com:443",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": [],
          "volumes": [],
        },
      },
    ]
  `);
});

test("scope annotations should be completely immutable", () => {
  parentScan.metadata.annotations["scope.cascading.securecodebox.io/domains"] =
    "example.com";
  parentScan.metadata.annotations["not.a.scope.annotation"] = "really";
  parentScan.spec.cascades.inheritAnnotations = false;
  sslyzeCascadingRules[0].spec.scanAnnotations = {
    "scope.cascading.securecodebox.io/domains": "malicious.example.com",
    "another.not.a.scope.annotation": "really",
  };
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

  const cascadedScans = () =>
    getCascadingScans(
      parentScan,
      findings,
      sslyzeCascadingRules,
      undefined,
      parseDefinition
    );

  expect(cascadedScans).toThrowError(
    "may not add scope annotation 'scope.cascading.securecodebox.io/domains':'malicious.example.com' in Cascading Rule spec"
  );

  delete sslyzeCascadingRules[0].spec.scanAnnotations[
    "scope.cascading.securecodebox.io/domains"
  ];

  const cascadedScan = cascadedScans()[0];

  expect(cascadedScan.metadata.annotations).toMatchInlineSnapshot(`
    {
      "another.not.a.scope.annotation": "really",
      "cascading.securecodebox.io/chain": "tls-scans",
      "cascading.securecodebox.io/matched-finding": undefined,
      "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
      "scope.cascading.securecodebox.io/domains": "example.com",
      "securecodebox.io/hook": "cascading-scans",
    }
  `);
});

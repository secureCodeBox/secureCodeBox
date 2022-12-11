// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

test(
  "zap automation scan without config against 'bodgeit' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-automation-bodgeit",
      "zap-automation-scan",
      ["-autorun", "/home/securecodebox/scb-automation/3-automation.yaml"],
      60 * 30,
      // volumes
      [{
        "name": "zap-automation-bodgeit",
        "configMap": {"name": "zap-automation-bodgeit"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-bodgeit",
          "mountPath": "/home/securecodebox/scb-automation/3-automation.yaml",
          "subPath": "3-automation.yaml"
      }],
    );
    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 5 * 1000
);

test(
  "zap automation scan without config against 'swagger-petstore' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-automation-petstore",
      "zap-automation-scan",
      ["-autorun", "/home/securecodebox/scb-automation/4-automation.yaml"],
      60 * 30,
      // volumes
      [{
        "name": "zap-automation-petstore",
        "configMap": {"name": "zap-automation-petstore"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-petstore",
          "mountPath": "/home/securecodebox/scb-automation/4-automation.yaml",
          "subPath": "4-automation.yaml"
      }],
    );
    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 5 * 1000
);

test(
  "zap automation scan against a plain nginx container should only find a couple of findings",
  async () => {
    const { count } = await scan(
      "zap-automation-nginx",
      "zap-automation-scan",
      ["-autorun", "/home/securecodebox/scb-automation/2-automation.yaml"],
      60 * 31 * 1000,
      // volumes
      [{
        "name": "zap-automation-nginx",
        "configMap": {"name": "zap-automation-nginx"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-nginx",
          "mountPath": "/home/securecodebox/scb-automation/2-automation.yaml",
          "subPath": "2-automation.yaml"
      }],
    );

    expect(count).toBeGreaterThanOrEqual(4);
  },
  60 * 5 * 1000
);

test(
  "authenticated zap automation scan with little spider time against a juice shop container should find some findings",
  async () => {
    const { count } = await scan(
      "zap-automation-juiceshop",
      "zap-automation-scan",
      ["-autorun", "/home/securecodebox/scb-automation/1-automation.yaml"],
      60 * 31 * 1000,
      // volumes
      [{
        "name": "zap-automation-scan-config",
        "configMap": {"name": "zap-automation-scan-config"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-scan-config",
          "mountPath": "/home/securecodebox/scb-automation/1-automation.yaml",
          "subPath": "1-automation.yaml"
      }],
    );

    expect(count).toBeGreaterThanOrEqual(5);
  },
  60 * 5 * 1000
);

/*test(
  "zap baseline scan against a plain nginx container should only find couple findings",
  async () => {
    const {categories, severities} = await scan(
      "zap-nginx-baseline",
      "zap-baseline-scan",
      ["-t", "http://nginx.demo-targets.svc"],
      60 * 4
    );

    expect(categories).toMatchInlineSnapshot(`
Object {
  "Content Security Policy (CSP) Header Not Set": 1,
  "In Page Banner Information Leak": 1,
  "Missing Anti-clickjacking Header": 1,
  "Permissions Policy Header Not Set": 1,
  "Server Leaks Version Information via \\"Server\\" HTTP Response Header Field": 1,
  "Storable and Cacheable Content": 1,
  "X-Content-Type-Options Header Missing": 1,
}
`);
    expect(severities).toMatchInlineSnapshot(`
Object {
  "informational": 1,
  "low": 4,
  "medium": 2,
}
`);
  },
  5 * 60 * 1000
);*/

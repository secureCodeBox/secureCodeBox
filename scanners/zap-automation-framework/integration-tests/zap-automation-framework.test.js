// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers.js");

test.concurrent(
  "zap automation scan without config against 'bodgeit' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-automation-framework-bodgeit",
      "zap-automation-framework",
      ["-autorun", "/home/securecodebox/scb-automation/automation.yaml"],
      60 * 30,
      // volumes
      [{
        "name": "zap-automation-framework-bodgeit",
        "configMap": {"name": "zap-automation-framework-bodgeit"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-framework-bodgeit",
          "mountPath": "/home/securecodebox/scb-automation/automation.yaml",
          "subPath": "automation.yaml"
      }],
    );
    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 8 * 1000
);

test.concurrent(
  "zap automation scan without config against 'swagger-petstore' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-automation-framework-petstore",
      "zap-automation-framework",
      ["-autorun", "/home/securecodebox/scb-automation/automation.yaml"],
      60 * 30,
      // volumes
      [{
        "name": "zap-automation-framework-petstore",
        "configMap": {"name": "zap-automation-framework-petstore"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-framework-petstore",
          "mountPath": "/home/securecodebox/scb-automation/automation.yaml",
          "subPath": "automation.yaml"
      }],
    );
    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 8 * 1000
);

test.concurrent(
  "zap automation scan against a plain nginx container should only find a couple of findings",
  async () => {
    const { count } = await scan(
      "zap-automation-framework-nginx",
      "zap-automation-framework",
      ["-autorun", "/home/securecodebox/scb-automation/automation.yaml"],
      60 * 31 * 1000,
      // volumes
      [{
        "name": "zap-automation-framework-nginx",
        "configMap": {"name": "zap-automation-framework-nginx"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-framework-nginx",
          "mountPath": "/home/securecodebox/scb-automation/automation.yaml",
          "subPath": "automation.yaml"
      }],
    );

    expect(count).toBeGreaterThanOrEqual(4);
  },
  60 * 8 * 1000
);

test.concurrent(
  "authenticated zap automation scan with little spider time against a juice shop container should find some findings",
  async () => {
    const { count } = await scan(
      "zap-automation-framework-juicehop",
      "zap-automation-framework",
      ["-autorun", "/home/securecodebox/scb-automation/automation.yaml"],
      60 * 31 * 1000,
      // volumes
      [{
        "name": "zap-automation-framework-juicehop",
        "configMap": {"name": "zap-automation-framework-juicehop"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-framework-juicehop",
          "mountPath": "/home/securecodebox/scb-automation/automation.yaml",
          "subPath": "automation.yaml"
      }],
    );

    expect(count).toBeGreaterThanOrEqual(4);
  },
  60 * 8 * 1000
);
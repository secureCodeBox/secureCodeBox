// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

test.concurrent(
  "zap automation scan without config against 'bodgeit' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-automation-bodgeit",
      "zap-automation-framework",
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
  60 * 8 * 1000
);

test.concurrent(
  "zap automation scan without config against 'swagger-petstore' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-automation-petstore",
      "zap-automation-framework",
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
  60 * 8 * 1000
);

test.concurrent(
  "zap automation scan against a plain nginx container should only find a couple of findings",
  async () => {
    const { count } = await scan(
      "zap-automation-nginx",
      "zap-automation-framework",
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
  60 * 8 * 1000
);

test.concurrent(
  "authenticated zap automation scan with little spider time against a juice shop container should find some findings",
  async () => {
    const { count } = await scan(
      "zap-automation-juiceshop",
      "zap-automation-framework",
      ["-autorun", "/home/securecodebox/scb-automation/1-automation.yaml"],
      60 * 31 * 1000,
      // volumes
      [{
        "name": "zap-automation-framework-config",
        "configMap": {"name": "zap-automation-framework-config"}
      }],
      // volumeMounts
      [{
          "name": "zap-automation-framework-config",
          "mountPath": "/home/securecodebox/scb-automation/1-automation.yaml",
          "subPath": "1-automation.yaml"
      }],
    );

    expect(count).toBeGreaterThanOrEqual(4);
  },
  60 * 8 * 1000
);
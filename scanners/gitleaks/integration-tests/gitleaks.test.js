// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers");

jest.retryTimes(3);

test(
  "Gitleaks should find 16 secrets in a specific commit",
  async () => {
    const { categories, severities, count } = await scan(
      "gitleaks-dummy-scan",
      "gitleaks",
      [
        "detect",
        "--source",
        "/repo/",
        "--log-opts=a7296dcaef571b9f1858069511f6678c1a6541ef..531d4bb6cc1189621d15b785afe34c877d4933a6"
      ],
      90,
      // volumes
      [{
          "name": "test-dir",
          "emptyDir": {}
      }],
      // volumeMounts
      [{
          "mountPath": "/repo/",
          "name": "test-dir"
      }],
      // initContainers
      [{
          "name": "init-git",
          "image": "bitnami/git",
          "command": ["git", "clone", "https://github.com/secureCodeBox/secureCodeBox", "/repo/"],
          "volumeMounts": [{
              "mountPath": "/repo/",
              "name": "test-dir"
          }]
      }]
    );

    expect(count).toBe(16);
    expect(categories).toEqual({
      "Potential Secret": 16,
    });
    expect(severities).toEqual({
      medium: 16
    });
  },
  3 * 60 * 1000
);
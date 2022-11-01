// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(0);

test(
  "semgrep should find 3 issues in the test file",
  async () => {
    const { categories, severities, count } = await scan(
      "semgrep-dummy-scan",
      "semgrep",
      [
        "-c",
        "r/python.django.security.injection.command.command-injection-os-system.command-injection-os-system",
        "/test/",
      ],
      90,
      // volumes
      [{
          "name": "test-dir",
          "configMap": {"name": "semgrep-test-file"}
      }],
      // volumeMounts
      [{
          "mountPath": "/test/",
          "name": "test-dir"
      }],
    );

    expect(count).toBe(3);
    expect(categories).toEqual({
      "security": 3,
    });
    expect(severities).toEqual({
      high: 3,
    });
  },
  3 * 60 * 1000
);

/* Disable this rule as it requires access to the Internet and clones a public GitHub repo
test(
  "semgrep should find 9 issues in the vulnerable flask app",
  async () => {
    const { categories, severities, count } = await scan(
      "semgrep-dummy-scan",
      "semgrep",
      [
        "-c",
        "p/ci",
        "/test/flask/",
      ],
      90,
      // volumes
      [{
          "name": "test-dir",
          "emptyDir": {}
      }],
      // volumeMounts
      [{
          "mountPath": "/test/",
          "name": "test-dir"
      }],
      // initContainers
      [{
          "name": "init-git",
          "image": "bitnami/git",
          "command": ["git", "clone", "https://github.com/we45/Vulnerable-Flask-App", "/test/flask/"],
          "volumeMounts": [{
              "mountPath": "/test/",
              "name": "test-dir"
          }]
      }]
    );

    expect(count).toBe(9);
    expect(categories).toEqual({
      "correctness": 1,
      "security": 8,
    });
    expect(severities).toEqual({
      high: 8,
      medium: 1,
    });
  },
  3 * 60 * 1000
);
*/

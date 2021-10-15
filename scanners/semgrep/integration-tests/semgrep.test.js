// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers");

jest.retryTimes(0);

test(
  "semgrep should find 3 issues in the test file",
  async () => {
    const { categories, severities, count } = await scan(
      "semgrep-dummy-scan",
      "semgrep",
      [
        "-c",
        "p/ci",
        "/test/",
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
          "name": "init-wget",
          "image": "busybox",
          "command": ["wget", "https://gist.githubusercontent.com/malexmave/886028ee1a340bb7ff4bcecf459c7866/raw/934466aa0ad59f352e1bf37a8ef162e199de9a73/testfile.py", "-O", "/test/offending-file.py"],
          "volumeMounts": [{
              "mountPath": "/test/",
              "name": "test-dir"
          }]
      }]
    );

    expect(count).toBe(3);
    expect(categories).toEqual({
      "security": 3,
    });
    expect(severities).toEqual({
      medium: 3,
    });
  },
  3 * 60 * 1000
);

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

// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers.js");

jest.retryTimes(0);

test(
  "Gitleaks should find one secret in a demo target",
  async () => {
    const { categories, severities, count } = await scan(
      "gitleaks-dummy-scan",
      "gitleaks",
      [
        "detect",
        "--source",
        "/repo/"
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
          "command": ["bash", 
                      "-c", 
                      // Bash script to create a git repo with a demo file
                      `cd /repo && \\
                      git init && \\
                      echo '-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBRQBYv0zGpMgMubh1XmkIZOrzi0WYXu8a1WMt3dBVJhgAAAKDyr4Ls8q+C
7AAAAAtzc2gtZWQyNTUxOQAAACBRQBYv0zGpMgMubh1XmkIZOrzi0WYXu8a1WMt3dBVJhg
AAAECvUx42+sMhjrgkMBXvanXL7LsJHj/QUX6NBSLN8hRj/FFAFi/TMakyAy5uHVeaQhk6
vOLRZhe7xrVYy3d0FUmGAAAAFnlvdXJfZW1haWxAZXhhbXBsZS5jb20BAgMEBQYH
-----END OPENSSH PRIVATE KEY-----' > secret.pem && \\
                      git config --global user.name test && \\
                      git config --global user.email user@example.com && \\
                      git add secret.pem && \\
                      git commit -m test`],
          "volumeMounts": [{
              "mountPath": "/repo/",
              "name": "test-dir"
          }]
      }]
    );

    expect(count).toBe(1);
    expect(categories).toEqual({
      "Potential Secret": 1,
    });
    expect(severities).toEqual({
      medium: 1
    });
  },
  3 * 60 * 1000
);
// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test.concurrent(
  "trivy image scan for a vulnerable juiceshop demo target",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-juice-test",
      "trivy-image",
      ["bkimminich/juice-shop:v10.2.0"],
      90
    );

    expect(count).toBeGreaterThanOrEqual(40);
    expect(categories["Image Vulnerability"]).toBeGreaterThanOrEqual(10);
    expect(categories["NPM Package Vulnerability"]).toBeGreaterThanOrEqual(30);
    expect(severities["high"]).toBeGreaterThanOrEqual(20);
    expect(severities["medium"]).toBeGreaterThanOrEqual(10);
    expect(severities["low"]).toBeGreaterThanOrEqual(1);
  },
  3 * 60 * 1000
);

test.concurrent(
  "trivy filesystem scan with exiting files should not fail",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-filesystem-test",
      "trivy-filesystem",
      ["/repo/"],
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
                      git clone https://github.com/knqyf263/trivy-ci-test`],
          "volumeMounts": [{
              "mountPath": "/repo/",
              "name": "test-dir"
          }]
      }]
    );

    expect(count).toBeGreaterThanOrEqual(9);
    expect(severities["high"]).toBeGreaterThanOrEqual(2);
    expect(severities["medium"]).toBeGreaterThanOrEqual(1);
  },
  3 * 60 * 1000
);

test.concurrent(
  "trivy repo scan with exiting repo should not fail",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-repo-test",
      "trivy-repo",
      ["https://github.com/knqyf263/trivy-ci-test"],
      90
    );

    expect(count).toBeGreaterThanOrEqual(9);
    expect(severities["high"]).toBeGreaterThanOrEqual(2);
    expect(severities["medium"]).toBeGreaterThanOrEqual(1);
  },
  3 * 60 * 1000
);

test.concurrent(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan(
        "trivy-invalidArg",
        "trivy",
        ["--invalidArg", "not/a-valid-image:v0.0.0"],
        90
      )
    ).rejects.toThrow("HTTP request failed");
  },
  3 * 60 * 1000
);

test.concurrent(
  "trivy k8s scan should not fail",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-k8s-test",
      "trivy-k8s",
      // scanners is limited to config, and namespace to default to reduce the time of the test
      ["cluster", "--debug","--scanners", "config", "--namespace", "default"],
      10 * 60 * 1000
    );

    // since the state of the k8s cluster in the test environment cannot be predicted, only the structure of the result is assured here
    expect(count).toBeGreaterThanOrEqual(1);

    const categoryNames = Object.keys(categories);
    expect(categoryNames).toHaveLength(1);
    expect(categoryNames.includes("Misconfiguration")).toBeTruthy();

    const severityNames = Object.keys(severities);
    expect(severityNames).toHaveLength(3);
    expect(severityNames.includes("high")).toBeTruthy();
    expect(severityNames.includes("low")).toBeTruthy();
    expect(severityNames.includes("medium")).toBeTruthy();
  },
  10 * 60 * 1000
);

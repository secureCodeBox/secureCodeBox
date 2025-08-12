// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test(
  "trivy image scan for a vulnerable juiceshop demo target",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-juice-test",
      "trivy-image",
      ["bkimminich/juice-shop:v18.0.0"],
      90,
    );

    expect(count).toBeGreaterThanOrEqual(40);
    expect(categories["Image Vulnerability"]).toBeGreaterThanOrEqual(10);
    expect(categories["NPM Package Vulnerability"]).toBeGreaterThanOrEqual(30);
    expect(severities["high"]).toBeGreaterThanOrEqual(20);
    expect(severities["medium"]).toBeGreaterThanOrEqual(10);
    expect(severities["low"]).toBeGreaterThanOrEqual(1);
  },
  { timeout: 3 * 60 * 1000 },
);

test(
  "trivy filesystem scan with exiting files should not fail",
  async () => {
    const { severities, count } = await scan(
      "trivy-filesystem-test",
      "trivy-filesystem",
      ["/repo/"],
      90,
      // volumes
      [
        {
          name: "test-dir",
          emptyDir: {},
        },
      ],
      // volumeMounts
      [
        {
          mountPath: "/repo/",
          name: "test-dir",
        },
      ],
      // initContainers
      [
        {
          name: "init-git",
          image: "alpine/git",
          command: [
            "bash",
            "-c",
            // Bash script to create a git repo with a demo file
            `cd /repo && \\
                      git clone https://github.com/knqyf263/trivy-ci-test`,
          ],
          volumeMounts: [
            {
              mountPath: "/repo/",
              name: "test-dir",
            },
          ],
        },
      ],
    );

    expect(count).toBeGreaterThanOrEqual(9);
    expect(severities["high"]).toBeGreaterThanOrEqual(2);
    expect(severities["medium"]).toBeGreaterThanOrEqual(1);
  },
  { timeout: 3 * 60 * 1000 },
);

test(
  "trivy repo scan with exiting repo should not fail",
  async () => {
    const { severities, count } = await scan(
      "trivy-repo-test",
      "trivy-repo",
      ["https://github.com/knqyf263/trivy-ci-test"],
      90,
    );

    expect(count).toBeGreaterThanOrEqual(9);
    expect(severities["high"]).toBeGreaterThanOrEqual(2);
    expect(severities["medium"]).toBeGreaterThanOrEqual(1);
  },
  { timeout: 3 * 60 * 1000 },
);

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan(
        "trivy-invalid-arg",
        "trivy-image",
        ["--invalidArg", "not/a-valid-image:v0.0.0"],
        90,
      ),
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"',
    );
  },
  { timeout: 3 * 60 * 1000 },
);
test(
  "trivy k8s scan should not fail",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-k8s-test",
      "trivy-k8s",
      // scanners is limited to config, and namespace to default to reduce the time of the test
      [
        "--debug",
        "--scanners",
        "misconfig",
        "--include-namespaces",
        "securecodebox-system",
      ],
      10 * 60 * 1000,
    );

    // since the state of the k8s cluster in the test environment cannot be predicted, only the structure of the result is assured here
    expect(count).toBeGreaterThanOrEqual(1);

    const categoryNames = Object.keys(categories);
    expect(categoryNames).toHaveLength(1);
    expect(categoryNames.includes("Misconfiguration")).toBeTruthy();

    const severityNames = Object.keys(severities);
    expect(severityNames).toHaveLength(3);
    expect(severityNames.includes("low")).toBeTruthy();
    expect(severityNames.includes("medium")).toBeTruthy();
    expect(severityNames.includes("high")).toBeTruthy();
  },
  { timeout: 10 * 60 * 1000 },
);

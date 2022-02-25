// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "trivy scans vulnerable juiceshop demo target",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-juice-shop",
      "trivy",
      "image",
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

test(
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

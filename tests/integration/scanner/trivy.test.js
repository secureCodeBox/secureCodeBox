// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../helpers");

jest.retryTimes(3);

test(
  "trivy scans vulnerable juiceshop demo target",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-juice-shop",
      "trivy",
      ["bkimminich/juice-shop:v10.2.0"],
      90
    );

    expect(count).toBeGreaterThanOrEqual(134);
    expect(categories["Image Vulnerability"]).toBeGreaterThanOrEqual(26);
    expect(categories["NPM Package Vulnerability"]).toBeGreaterThanOrEqual(108);
    expect(severities["high"]).toBeGreaterThanOrEqual(82);
    expect(severities["medium"]).toBeGreaterThanOrEqual(47);
    expect(severities["low"]).toBeGreaterThanOrEqual(5);
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

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
      ["bkimminich/juice-shop:v12.9.0"],
      90
    );

    expect(count).toBe(32);
    expect(categories).toMatchInlineSnapshot(`
Object {
  "NPM Package Vulnerability": 32,
}
`);
    expect(severities).toMatchInlineSnapshot(`
Object {
  "high": 22,
  "low": 1,
  "medium": 9,
}
`);
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

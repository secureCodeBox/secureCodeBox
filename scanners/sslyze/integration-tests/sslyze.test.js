// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "Sslyze scans the self-signed unsafe-https demo-target",
  async () => {
    const {categories, severities, count} = await scan(
      "sslyze-unsafe-https",
      "sslyze",
      ["--mozilla_config=intermediate", "unsafe-https.demo-targets.svc"],
      90
    );

    expect(count).toBe(4);
    expect(categories).toMatchInlineSnapshot(`
      {
        "Invalid Certificate": 1,
        "Outdated TLS Version": 2,
        "TLS Service Info": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "informational": 1,
        "medium": 3,
      }
    `);
  },
  3 * 60 * 1000
);

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan("sslyze-invalidArg", "sslyze", ["--invalidArg", "example.com"], 90)
    ).rejects.toThrow("HTTP request failed");
  },
  3 * 60 * 1000
);

// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const retry = require("../retry");

const { scan } = require("../helpers");

retry(
  "Sslyze scans the self-signed unsafe-https demo-app",
  3,
  async () => {
    const { categories, severities, count } = await scan(
      "sslyze-unsafe-https",
      "sslyze",
      ["--regular", "unsafe-https.demo-apps.svc"],
      90
    );

    expect(count).toBe(4);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Invalid Certificate": 1,
        "Outdated TLS Version": 2,
        "TLS Service Info": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "informational": 1,
        "medium": 3,
      }
    `);
  },
  3 * 60 * 1000
);

retry(
  "Invalid argument should be marked as errored",
  3,
  async () => {
    await expect(
      scan("sslyze-invalidArg", "sslyze", ["--invalidArg", "example.com"], 90)
    ).rejects.toThrow("HTTP request failed");
  },
  3 * 60 * 1000
);

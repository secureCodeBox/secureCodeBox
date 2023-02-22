// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "Whatweb scans example.com",
  async () => {
    const {categories, severities, count} = await scan(
      "whatweb-example",
      "whatweb",
      ["example.com"],
      90
    );

    expect(count).toBe(1);
    expect(categories).toMatchInlineSnapshot(`
      {
        "WEB APPLICATION": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "informational": 1,
      }
    `);
  },
  3 * 60 * 1000
);

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan("whatweb-invalidArg", "whatweb", ["--invalidArg", "example.com"], 90)
    ).rejects.toThrow("HTTP request failed");
  },
  3 * 60 * 1000
);

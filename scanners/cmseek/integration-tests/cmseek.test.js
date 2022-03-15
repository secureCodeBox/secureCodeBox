// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../helpers");

jest.retryTimes(3);

test(
  "cmseek scans old-joomla for vulnerabilities without redirection",
  async () => {
    const { categories, severities, count } = await scan(
      "cmseek-old-joomla",
      "cmseek",
      ["-u", "old-joomla.demo-targets.svc", "--no-redirect"],
      90
    );

    expect(count).toBe(3);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Visible internal files": 1,
        "Vulnerability": 2,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "high": 2,
        "informational": 1,
      }
    `);
  },
  3 * 60 * 1000
);

test(
  "cmseek scans old-joomla for vulnerabilities with redirection",
  async () => {
    const { categories, severities, count } = await scan(
      "cmseek-old-joomla",
      "cmseek",
      ["-u", "old-joomla.demo-targets.svc", "--follow-redirect"],
      90
    );

    expect(count).toBe(1);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Visible internal files": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
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
      scan("cmseek-invalidArg", "cmseek", ["--invalidArg", "example.com"], 90)
    ).rejects.toThrow("HTTP request failed");
  },
  3 * 60 * 1000
);

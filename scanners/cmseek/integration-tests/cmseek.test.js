// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test.skip(
  "cmseek scans old-joomla for vulnerabilities without redirection",
  async () => {
    const { categories, severities, count } = await scan(
      "cmseek-old-joomla",
      "cmseek",
      ["-u", "old-joomla.demo-targets.svc", "--no-redirect"],
      90,
    );

    expect(count).toBe(3);
    expect(categories).toMatchInlineSnapshot(`
      {
        "Visible internal files": 1,
        "Vulnerability": 2,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "high": 2,
        "informational": 1,
      }
    `);
  },
  {
    timeout: 3 * 60 * 1000,
  },
);

test.skip(
  "cmseek scans old-joomla for vulnerabilities with redirection",
  async () => {
    const { categories, severities, count } = await scan(
      "cmseek-old-joomla",
      "cmseek",
      ["-u", "old-joomla.demo-targets.svc", "--follow-redirect"],
      90,
    );

    expect(count).toBe(1);
    expect(categories).toMatchInlineSnapshot(`
      {
        "Visible internal files": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "informational": 1,
      }
    `);
  },
  {
    timeout: 3 * 60 * 1000,
  },
);

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan("cmseek-invalid-arg", "cmseek", ["--invalidArg", "example.com"], 90),
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"',
    );
  },
  {
    timeout: 3 * 60 * 1000,
  },
);

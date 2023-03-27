// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "localhost port scan should only find a host finding",
  async () => {
    const { categories, severities, count } = await scan(
      "doggo-localhost",
      "doggo",
      ["example.com"],
      90
    );

    expect(count).toBeGreaterThanOrEqual(1);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "DNS Information": 1,
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
  "invalid scan should be marked as errored",
  async () => {
    await expect(
      scan("doggo-localhost", "doggo", ["-invalidFlag", "localhost"], 90)
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"'
    );
  },
  3 * 60 * 1000
);

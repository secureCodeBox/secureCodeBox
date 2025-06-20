// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers.js");

jest.retryTimes(3);

test(
  "localhost scan should find at least one finding",
  async () => {
    const { categories, severities, count } = await scan(
      "subfinder-localhost",
      "subfinder",
      ["localhost"],
      90
    );

    // TODO: Implement at least one scanner specific integration test 
    expect(count).toBeGreaterThanOrEqual(1);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "INFORMATIONAL": 1,
      }
    `);
  },
  3 * 60 * 1000
);

test(
  "invalid scan parameters should be marked as errored",
  async () => {
    await expect(
      scan("subfinder-localhost", "subfinder", ["-invalidFlag", "localhost"], 90)
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"'
    );
  },
  3 * 60 * 1000
);

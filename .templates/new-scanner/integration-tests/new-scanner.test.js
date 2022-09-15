// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "localhost scan should find at least one finding",
  async () => {
    const { categories, severities, count } = await scan(
      "new-scanner-localhost",
      "new-scanner",
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
      scan("new-scanner-localhost", "new-scanner", ["-invalidFlag", "localhost"], 90)
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"'
    );
  },
  3 * 60 * 1000
);

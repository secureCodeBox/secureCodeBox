// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {
  scan
} = require("../../helpers");

jest.retryTimes(3);

test(
  "localhost port scan should only find a host finding",
  async () => {
      const {
        categories,
        severities,
        count
      } = await scan(
        "doggo-localhost",
        "doggo",
        ["example.com"],
        90
      );

      expect(count).toBeGreaterThanOrEqual(1);
      expect(categories).toMatchInlineSnapshot(`
      {
        "DNS Information": 1,
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
/* 
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
*/
// This is temporary replacement for the above test. Doggo currently returns a 0 exit code even if the scan fails.
// This is a bug in doggo and has been reported recently in https://github.com/mr-karan/doggo/issues/68.
// Once this is fixed, the above test should be re-enabled.
// This test below should be removed once the above test is re-enabled
// if the test below fails due to scan failure, then it's likely the test above should be re-enabled
test(
  "invalid scan should get empty results",
  async () => {
      await expect(
        scan("doggo-localhost", "doggo", ["-invalidFlag", "localhost"], 90)
      ).resolves.toMatchInlineSnapshot(`
      {
        "severities": {},
      }
    `);
    },
    3 * 60 * 1000
);

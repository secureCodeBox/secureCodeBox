// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../helpers");

jest.retryTimes(3);

test(
  "Parser must fail on invalid findings",
  async () => {
    await expect(
      // passing hello-world as args, as at least one parameter is required
      scan("invalid-findings-test-scan", "test-scan", ["hello-world"], 90)
    ).rejects.toThrow(
      `Scan failed with description "Failed to run the Parser. This is likely a Bug, we would like to know about. Please open up a Issue on GitHub."`
    );
  },
  3 * 60 * 1000
);

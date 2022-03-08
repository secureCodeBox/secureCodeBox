// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../helpers");

jest.retryTimes(3);

test(
  "scan without a matching ScanType should be marked as errored",
  async () => {
    await expect(
      scan("scan-type-not-found", "this-type-does-not-exists", [], 30)
    ).rejects.toThrow(
      `Scan failed with description "Configured ScanType 'this-type-does-not-exists' not found in 'integration-tests' namespace. You'll likely need to deploy the ScanType."`
    );
  },
  1 * 60 * 1000
);

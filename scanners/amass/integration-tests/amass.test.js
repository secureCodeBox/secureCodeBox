// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers.js");
jest.retryTimes(3);

test(
  "amass should find at least 20 subdomains",
  async () => {
    const { count } = await scan(
      "amass-scanner-dummy-scan",
      "amass",
      ["-norecursive", "-timeout", "1", "-d", "owasp.org"],
      180
    );
    expect(count).toBeGreaterThanOrEqual(100); // The scan is passive, so we can expect a lot of subdomains
  },
  10 * 60 * 1000
);

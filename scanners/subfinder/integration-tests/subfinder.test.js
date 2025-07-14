// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers.js");
jest.retryTimes(3);

test(
  "subfinder should find at least 10 subdomains",
  async () => {
    const { count } = await scan(
      "subfinder-scanner-dummy-scan",
      "subfinder",
      ["-d", "securecodebox.io"],
      180
    );
    expect(count).toBeGreaterThanOrEqual(10); // The scan is passive, so we can expect a lot of subdomains
  },
  10 * 60 * 1000
);

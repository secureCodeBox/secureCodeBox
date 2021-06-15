// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("./helpers");

jest.retryTimes(3);

test(
  "amass should find at least 20 subdomains",
  async () => {
    const { count } = await scan(
      "amass-scanner-dummy-scan",
      "amass",
      ["-passive", "-noalts", "-norecursive", "-d", "owasp.org"],
      90
    );
    expect(count).toBeGreaterThanOrEqual(20);
  },
  3 * 60 * 1000
);

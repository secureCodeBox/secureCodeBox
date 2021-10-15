// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers");

jest.retryTimes(3);

test(
  "WPScan should find at least 1 finding regarding the old-wordpress demo app",
  async () => {
    const { count } = await scan(
      "wpscan-scanner-dummy-scan",
      "wpscan",
      ["--url", "old-wordpress.demo-targets.svc"],
      90
    );
    expect(count).toBeGreaterThanOrEqual(0);
  },
  3 * 60 * 1000
);

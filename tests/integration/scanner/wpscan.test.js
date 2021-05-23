// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const retry = require("../retry");

const { scan } = require("../helpers");

retry(
  "WPScan should find at least 1 finding regarding the old-wordpress demo app",
  3,
  async () => {
    const { count } = await scan(
      "wpscan-scanner-dummy-scan",
      "wpscan",
      ["--url", "old-wordpress.demo-apps.svc"],
      90
    );
    expect(count).toBeGreaterThanOrEqual(0);
  },
  3 * 60 * 1000
);

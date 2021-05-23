// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const retry = require("../retry");

const { scan } = require("../helpers");

retry(
  "Finding Post Processing after test-scan",
  3,
  async () => {
    const { severities, count } = await scan(
      "finding-post-processing",
      "test-scan",
      [],
      90
    );

    expect(count).toBe(2);
    expect(severities.high).toBe(1);
  },
  3 * 60 * 1000
);

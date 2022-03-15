// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "Finding Post Processing after test-scan",
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

// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../helpers");

jest.retryTimes(3);

test(
  "localhost port scan should only find a host finding",
  async () => {
    const { categories, severities, count } = await scan(
      "test-scan-read-write-hook",
      "test-scan",
      [],
      90
    );

    expect(count).toBe(2);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Host": 1,
        "Open Port": 1,
        "fancy-category": 2,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "high": 2,
      }
    `);
  },
  3 * 60 * 1000
);

// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers.js");

jest.retryTimes(3);

test(
  "nikto scan against bodgeit demo-target",
  async () => {
    const { categories, severities } = await scan(
      "nikto-bodgeit",
      "nikto",
      [
        "-url",
        "http://bodgeit.demo-targets.svc:8080",
        "-Tuning",
        "1,2,3,5,7,b",
      ], // See nikto bodgeit example
      90
    );

    expect(categories).toMatchInlineSnapshot(`
      {
        "Identified Software": 1,
        "Nikto Finding": 3,
        "Potential Vulnerability": 12,
        "X-Content-Type-Options Header": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "high": 12,
        "informational": 5,
      }
    `);
  },
  3 * 60 * 1000
);

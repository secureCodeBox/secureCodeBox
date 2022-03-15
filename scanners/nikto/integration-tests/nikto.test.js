// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../helpers");


jest.retryTimes(3);

test(
  "nikto scan against bodgeit demo-target",
  async () => {
    const { categories, severities, count } = await scan(
      "nikto-bodgeit",
      "nikto",
      [
        "-h",
        "bodgeit.demo-targets.svc",
        "-port",
        "8080",
        "-Tuning",
        "1,2,3,5,7,b",
      ], // See nikto bodgeit example
      90
    );

    expect(count).toBe(13);
    expect(categories).toMatchInlineSnapshot(`
Object {
  "Identified Software": 1,
  "Nikto Finding": 3,
  "Potential Vulnerability": 7,
  "X-Content-Type-Options Header": 1,
  "X-Frame-Options Header": 1,
}
`);
    expect(severities).toMatchInlineSnapshot(`
Object {
  "high": 7,
  "informational": 5,
  "low": 1,
}
`);
  },
  3 * 60 * 1000
);

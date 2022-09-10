// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

test(
  "zap baseline scan against a plain nginx container should only find couple findings",
  async () => {
    const { categories, severities } = await scan(
      "zap-nginx-baseline",
      "zap-baseline-scan",
      ["-t", "http://nginx.demo-targets.svc"],
      60 * 4
    );

    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Content Security Policy (CSP) Header Not Set": 1,
        "Missing Anti-clickjacking Header": 1,
        "X-Content-Type-Options Header Missing": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "low": 1,
        "medium": 2,
      }
    `);
  },
  5 * 60 * 1000
);

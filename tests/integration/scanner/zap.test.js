// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const retry = require("../retry");

const { scan } = require("../helpers");

retry(
  "zap baseline scan against a plain nginx container should only find couple findings",
  3,
  async () => {
    const { categories, severities } = await scan(
      "zap-nginx-baseline",
      "zap-baseline",
      ["-t", "http://nginx.demo-apps.svc"],
      60 * 4
    );

    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Content Security Policy (CSP) Header Not Set": 1,
        "Server Leaks Version Information via \\"Server\\" HTTP Response Header Field": 1,
        "X-Content-Type-Options Header Missing": 1,
        "X-Frame-Options Header Not Set": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "low": 2,
        "medium": 2,
      }
    `);
  },
  5 * 60 * 1000
);

// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

test(
  "zap baseline scan against a plain nginx container should only find couple findings",
  async () => {
    const {categories, severities} = await scan(
      "zap-nginx-baseline",
      "zap-baseline-scan",
      ["-t", "http://nginx.demo-targets.svc"],
      60 * 4
    );

    expect(categories).toMatchInlineSnapshot(`
Object {
  "Content Security Policy (CSP) Header Not Set": 1,
  "In Page Banner Information Leak": 1,
  "Missing Anti-clickjacking Header": 1,
  "Permissions Policy Header Not Set": 1,
  "Server Leaks Version Information via \\"Server\\" HTTP Response Header Field": 1,
  "Storable and Cacheable Content": 1,
  "X-Content-Type-Options Header Missing": 1,
}
`);
    expect(severities).toMatchInlineSnapshot(`
Object {
  "informational": 1,
  "low": 4,
  "medium": 2,
}
`);
  },
  5 * 60 * 1000
);

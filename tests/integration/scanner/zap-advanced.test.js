// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../helpers");

jest.retryTimes(3);

test(
  "ZAP-advanced scan without config YAML against a plain 'nginx container' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-advanced-scan-nginx-demo",
      "zap-advanced-scan",
      ["-t", "http://nginx.demo-targets.svc"],
      60 * 15
    );

    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 16 * 1000
);

test(
  "ZAP-advanced scan without config YAML against 'bodgeit' container should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-advanced-scan-bodgeit-demo",
      "zap-advanced-scan",
      ["-t", "http://bodgeit.demo-targets.svc:8080/"],
      60 * 30
    );

    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 31 * 1000
);

test(
  "ZAP-advanced scan without config YAML against 'juiceshop' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-advanced-scan-juiceshop-demo",
      "zap-advanced-scan",
      ["-t", "http://juiceshop.demo-targets.svc:3000/"],
      60 * 30
    );

    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 31 * 1000
);

test(
  "ZAP-advanced scan without config YAML against 'swagger-petstore' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-advanced-scan-petstore-demo",
      "zap-advanced-scan",
      ["-t", "http://petstore.demo-targets.svc/"],
      60 * 30
    );

    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 31 * 1000
);

// test(
//   "ZAP-advanced scan without config YAML against 'old-wordpress' should only find couple findings",
//   async () => {
//     const { count } = await scan(
//       "zap-advanced-scan-wordpress-demo",
//       "zap-advanced-scan",
//       ["-t", "http://old-wordpress.demo-targets.svc/"],
//       60 * 5
//     );

//     // There must be at least one finding
//     expect(count).toBeGreaterThanOrEqual(1);
//   },
//   60 * 5 * 1000
// );

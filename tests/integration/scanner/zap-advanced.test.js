const { scan } = require("../helpers");

test(
  "ZAP-advanced scan without config YAML against a plain 'nginx container' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-advanced-scan-nginx-demo",
      "zap-advanced-scan",
      ["-t", "http://nginx.demo-apps.svc"],
      60 * 6
    );

    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 7 * 1000
);

test(
  "ZAP-advanced scan without config YAML against 'bodgeit' container should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-advanced-scan-bodgeit-demo",
      "zap-advanced-scan",
      ["-t", "http://bodgeit.demo-apps.svc:8080/"],
      60 * 15
    );

    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 16 * 1000
);

test(
  "ZAP-advanced scan without config YAML against 'juiceshop' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-advanced-scan-juiceshop-demo",
      "zap-advanced-scan",
      ["-t", "http://juiceshop.demo-apps.svc:3000/"],
      60 * 15
    );

    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 16 * 1000
);

test(
  "ZAP-advanced scan without config YAML against 'swagger-petstore' should only find couple findings",
  async () => {
    const { count } = await scan(
      "zap-advanced-scan-petstore-demo",
      "zap-advanced-scan",
      ["-t", "http://petstore.demo-apps.svc/"],
      60 * 15
    );

    // There must be at least one finding
    expect(count).toBeGreaterThanOrEqual(1);
  },
  60 * 16 * 1000
);

// test(
//   "ZAP-advanced scan without config YAML against 'old-wordpress' should only find couple findings",
//   async () => {
//     const { count } = await scan(
//       "zap-advanced-scan-wordpress-demo",
//       "zap-advanced-scan",
//       ["-t", "http://old-wordpress.demo-apps.svc/"],
//       60 * 5
//     );

//     // There must be at least one finding
//     expect(count).toBeGreaterThanOrEqual(1);
//   },
//   60 * 5 * 1000
// );

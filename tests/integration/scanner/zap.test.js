const { scan } = require("../helpers");

test(
  "zap baseline scan against a plain nginx container should only find couple findings",
  async () => {
    const { categories, severities } = await scan(
      "zap-nginx-baseline",
      "zap-baseline",
      ["-t", "http://nginx.demo-apps.svc"],
      60 * 4
    );

    expect(categories).toMatchObject({
      "Content Security Policy (CSP) Header Not Set": 1,
      'Server Leaks Version Information via "Server" HTTP Response Header Field': 1,
      "X-Content-Type-Options Header Missing": 1,
      "X-Frame-Options Header Not Set": 1,
    });
    expect(severities).toMatchObject({
      low: 3,
      medium: 1,
    });
  },
  5 * 60 * 1000
);

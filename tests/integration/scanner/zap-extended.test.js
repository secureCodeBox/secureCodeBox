const { scan } = require("../helpers");

test(
  "ZAP-extended baseline scan against a plain nginx container should only find couple findings",
  async () => {
    const { categories, severities } = await scan(
      "zap-extended-baseline-scan-nginx-demo",
      "zap-extended-baseline-scan",
      ["-t", "http://nginx.demo-apps.svc"],
      60 * 6
    );

    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Content Security Policy (CSP) Header Not Set": 2,
        "Incomplete or No Cache-control and Pragma HTTP Header Set": 1,
        "Retrieved from Cache": 1,
        "Server Leaks Version Information via \\"Server\\" HTTP Response Header Field": 2,
        "Strict-Transport-Security Header Not Set": 1,
        "X-Content-Type-Options Header Missing": 2,
        "X-Frame-Options Header Not Set": 2,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "informational": 1,
        "low": 6,
        "medium": 4,
      }
    `);
  },
  6 * 60 * 1000
);

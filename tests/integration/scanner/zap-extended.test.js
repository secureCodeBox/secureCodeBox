const { scan } = require("../helpers");

test(
  "ZAP-extended scan without config YAML against a plain 'nginx container' should only find couple findings",
  async () => {
    const { categories, severities } = await scan(
      "zap-extended-scan-nginx-demo",
      "zap-extended-scan",
      ["-t", "http://nginx.demo-apps.svc"],
      60 * 6
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
  6 * 60 * 1000
);

test(
  "ZAP-extended scan without config YAML against 'bodgeit' container should only find couple findings",
  async () => {
    const { categories, severities } = await scan(
      "zap-extended-scan-bodgeit-demo",
      "zap-extended-scan",
      ["-t", "http://bodgeit.demo-apps.svc:8080/bodgeit/"],
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

test(
  "ZAP-extended scan without config YAML against 'juiceshop' should only find couple findings",
  async () => {
    const { categories, severities } = await scan(
      "zap-extended-scan-juiceshop-demo",
      "zap-extended-scan",
      ["-t", "http://juiceshop.demo-apps.svc:3000/"],
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

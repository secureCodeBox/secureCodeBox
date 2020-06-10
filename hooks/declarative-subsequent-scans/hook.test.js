const { getCascadingScans } = require("./hook");

test("Should create subsequent scans for open HTTPS ports (NMAP findings)", () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadingRules = [
    {
      apiVersion: "cascading.experimental.securecodebox.io/v1",
      kind: "CascadingRule",
      metadata: {
        name: "tls-scans"
      },
      spec: {
        matches: [
          {
            category: "Open Port",
            attributes: {
              port: 443,
              service: "https"
            }
          },
          {
            category: "Open Port",
            attributes: {
              service: "https"
            }
          }
        ],
        scanSpec: {
          name: "sslyze",
          parameters: ["--regular", "{{attributes.hostname}}"]
        }
      }
    }
  ];

  const cascadedScans = getCascadingScans(findings, cascadingRules);

  expect(cascadedScans).toMatchInlineSnapshot(`
    Array [
      Object {
        "name": "sslyze",
        "parameters": Array [
          "--regular",
          "foobar.com",
        ],
      },
    ]
  `);
});

test("Should create no subsequent scans if there are no rules", () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https"
      }
    }
  ];

  const cascadingRules = [];

  const cascadedScans = getCascadingScans(findings, cascadingRules);

  expect(cascadedScans).toMatchInlineSnapshot(`Array []`);
});

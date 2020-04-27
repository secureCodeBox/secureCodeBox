const { startSecurityTest, Time } = require("./sdk");

test(
  "finds open 3000 port of juiceshop",
  async () => {
    const securityTest = await startSecurityTest({
      context: "JuiceShopPortScan",
      metaData: {},
      name: "combined-nmap-nikto",
      target: {
        name: "JuiceShop Container",
        location: "juice-shop",
        attributes: {
          NIKTO_PORTS: "3000",
          COMBINED_NMAP_NIKTO_PORTS: "80, 443, 3000, 8080, 8443",
        },
      },
    });

    const { report } = securityTest;

    const findings = report.findings.map(({ name, osi_layer, severity }) => ({
      name,
      osi_layer,
      severity,
    }));

    expect(findings).toContainEqual({
      name: "Retrieved access-control-allow-origin header: *",
      osi_layer: "APPLICATION",
      severity: "INFORMATIONAL",
    });

    expect(findings).toContainEqual({
      name:
        "The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS",
      osi_layer: "APPLICATION",
      severity: "INFORMATIONAL",
    });
  },
  10 * Time.Minute
);

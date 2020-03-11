const { startSecurityTest, Time } = require('./sdk');

test(
  'finds open 3000 port of juiceshop',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'JuiceShopPortScan',
      metaData: {},
      name: 'nikto',
      target: {
        name: 'JuiceShop Container',
        location: 'juice-shop',
        attributes: {
          NIKTO_PORTS: "3000",
          COMBINED_NMAP_NIKTO_PORTS: "80, 443, 3000, 8080, 8443",
        },
      },
    });

    const { report } = securityTest;

    const [finding1, finding2, finding3, ...otherFindings] = report.findings.map(
      ({ name, osi_layer, severity }) => ({
        name,
        osi_layer,
        severity,
      })
    );

    expect(finding1).toMatchObject({
      name: 'Retrieved x-powered-by header: Express',
      osi_layer: 'APPLICATION',
      severity: 'INFORMATIONAL',
    });

    expect(finding2).toMatchObject({
      name: 'Retrieved access-control-allow-origin header: *',                                                                                               
      osi_layer: 'APPLICATION',                                                                                                                              
      severity: 'INFORMATIONAL'                  
    });

    expect(finding3).toMatchObject({
      name: 'The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS',
      osi_layer: 'APPLICATION',
      severity: 'INFORMATIONAL'
    });
  },
  5 * Time.Minute
);

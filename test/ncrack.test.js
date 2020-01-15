const { startSecurityTest, Time } = require('./sdk');

test(
  'bruteforce scan juiceshop',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'BruteforceScanJuiceShop',
      metaData: {},
      name: 'ncrack',
      target: {
        name: 'JuiceShop Container',
        location: 'juice-shop',
        attributes: {
          NCRACK_PARAMETER: '--user admin --pass 1234',
        },
      },
    });

    const { report } = securityTest;

    const [finding1, ...otherFindings] = report.findings.map(
      ({ description, category, name, osi_layer, severity }) => ({
        description,
        category,
        name,
        osi_layer,
        severity,
      })
    );

    expect(finding1).toEqual([]);
  },
  1 * Time.Minute
);
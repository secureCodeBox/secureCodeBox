const { startSecurityTest, Time } = require('./sdk');

test(
  'bruteforce scan find credentials for camundadb',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'BruteforceScanCamundadb',
      metaData: {},
      name: 'ncrack',
      target: {
        name: 'Camundadb Container',
        location: 'mysql://camundadb',
        attributes: {
          NCRACK_PARAMETER: '--user root --pass root',
        },
      },
    });

    const { report } = securityTest;

    const [finding1, ...otherFindings] = report.findings.map(
      ({ category, osi_layer, severity, attributes }) => ({
        category,
        osi_layer,
        severity,
        attributes,
      })
    );

    expect(finding1).toMatchObject({
      category: 'Discovered Credentials',
      osi_layer: 'APPLICATION',
      severity: 'HIGH',
      attributes: {
            "password": "root",
            "port": "3306",
            "protocol": "tcp",
            "service": "mysql",
            "username": "root",
           },
    });

    expect(otherFindings).toEqual([]);
  },
  1 * Time.Minute
);
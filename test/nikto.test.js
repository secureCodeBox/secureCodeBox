const { startSecurityTest, Time } = require('./sdk');

test.skip(
  'finds a few findings for juice-shop',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'bodgeit webserver',
      metaData: {},
      name: 'nikto',
      target: {
        name: 'BodgeIt',
        location: 'bodgeit',
        attributes: {
          NIKTO_PORTS: '8080',
        },
      },
    });

    const { report } = securityTest;

    const findings = report.findings.map(({ name, category, severity }) => ({
      name,
      category,
      severity,
    }));

    console.log(report.findings);
  },
  5 * Time.Minute
);

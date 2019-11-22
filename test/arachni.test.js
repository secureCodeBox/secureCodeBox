const { startSecurityTest, Time } = require('./sdk');

test(
  'finds a few findings for a bare nginx container',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'nginx bare',
      metaData: {},
      name: 'arachni',
      target: {
        name: 'nginx bare',
        location: 'http://nginx',
        attributes: {},
      },
    });

    const { report } = securityTest;

    const findings = report.findings.map(({ name, category, severity }) => ({
      name,
      category,
      severity,
    }));

    expect(findings).toContainEqual({
      name: "Missing 'X-Frame-Options' header",
      category: 'Missing X-Frame-Options header',
      severity: 'LOW',
    });

    expect(findings.length).toEqual(1);
  },
  5 * Time.Minute
);

const { startSecurityTest, Time } = require('./sdk');

test(
  'finds a few findings for a bare nginx container',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'nginx bare',
      metaData: {},
      name: 'zap',
      target: {
        name: 'nginx bare',
        location: 'http://nginx',
        attributes: {
          ZAP_BASE_URL: 'http://nginx',
        },
      },
    });

    const { report } = securityTest;

    const findings = report.findings.map(({ name, severity }) => ({
      name,
      severity,
    }));

    expect(findings).toContainEqual({
      name: 'X-Frame-Options Header Not Set',
      severity: 'MEDIUM',
    });
    expect(findings).toContainEqual({
      name: 'Web Browser XSS Protection Not Enabled',
      severity: 'LOW',
    });
    expect(findings).toContainEqual({
      name: 'X-Content-Type-Options Header Missing',
      severity: 'LOW',
    });

    // There should be more than 3 findings as most findings are replicated for every page.
    expect(findings.length).toBeGreaterThan(3);
  },
  5 * Time.Minute
);

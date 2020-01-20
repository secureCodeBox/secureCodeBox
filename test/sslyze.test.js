const { startSecurityTest, Time } = require('./sdk');

test(
  'finds tls information for host with self signed cert',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'securecodebox.io tls',
      metaData: {},
      name: 'sslyze',
      target: {
        name: 'unsafe-https server',
        location: 'unsafe-https',
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
      name: 'Certificate is not trusted',
      category: 'Certificate info',
      severity: 'MEDIUM',
    });
    expect(findings).toContainEqual({
      name: 'Must-Staple unsupported',
      category: 'Certificate info',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'No extended validation certificate',
      category: 'Certificate info',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'No OCSP response',
      category: 'Certificate info',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'Ticket resumption supported',
      category: 'Resumption',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'Session resumption failed',
      category: 'Resumption',
      severity: 'LOW',
    });
    expect(findings).toContainEqual({
      name: 'TLSv1 supported',
      category: 'TLSv1',
      severity: 'LOW',
    });
    expect(findings).toContainEqual({
      name: 'TLSv1.1 supported',
      category: 'TLSv1.1',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'TLSv1.2 supported',
      category: 'TLSv1.2',
      severity: 'INFORMATIONAL',
    });
  },
  5 * Time.Minute
);

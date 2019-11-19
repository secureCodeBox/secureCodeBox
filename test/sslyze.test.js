const { startSecurityTest, Time } = require('./sdk');

test(
  'finds tls information for securecodebox.io',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'securecodebox.io tls',
      metaData: {},
      name: 'sslyze',
      target: {
        name: 'securecodebox.io',
        location: 'securecodebox.io',
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
      name: 'Must-Staple unsupported',
      category: 'Certificate info',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'Certificate includes SCTS count',
      category: 'Certificate info',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'No extended validation certificate',
      category: 'Certificate info',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'Ticket resumption supported',
      category: 'Resumption',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'Session resumption succeeded',
      category: 'Resumption',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'Session resumption succeeded',
      category: 'Resumption',
      severity: 'INFORMATIONAL',
    });
    expect(findings).toContainEqual({
      name: 'TLSv1.2 supported',
      category: 'TLSv1.2',
      severity: 'INFORMATIONAL',
    });

    // Should only detect findings of 'informational' severity level and 1 TLSv1 finding
    expect(
      findings
        .filter(({ severity }) => severity !== 'INFORMATIONAL')
        .filter(({ name }) => name !== 'TLSv1 supported')
    ).toEqual([]);
  },
  5 * Time.Minute
);

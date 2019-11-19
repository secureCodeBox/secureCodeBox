const { startSecurityTest, Time } = require('./sdk');

test(
  'finds a few low severity findings for securecodebox.io',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'www.iteratec.de ssh',
      metaData: {},
      name: 'ssh',
      target: {
        name: 'www.iteratec.de ssh',
        location: 'www.iteratec.de',
        attributes: {},
      },
    });

    const { report } = securityTest;

    const findings = report.findings.map(
      ({ description, category, name, osi_layer, severity }) => ({
        description,
        category,
        name,
        osi_layer,
        severity,
      })
    );

    expect(findings).toContainEqual({
      category: 'SSH Service',
      description: undefined,
      name: 'SSH Service Information',
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
    });

    expect(findings).toContainEqual({
      category: 'SSH Policy Violation',
      description: 'Discouraged SSH authentication methods are used',
      name: 'Discouraged SSH authentication methods',
      osi_layer: 'NETWORK',
      severity: 'MEDIUM',
    });

    expect(
      findings
        .filter(({ name }) => name !== 'SSH Service Information')
        .filter(({ name }) => name !== 'Discouraged SSH authentication methods')
    ).toEqual([]);
  },
  2 * Time.Minute
);

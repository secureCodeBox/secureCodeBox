const { startSecurityTest, Time } = require('./sdk');

test(
  'finds a few low severity findigns for securecodebox.io',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'securecodebox.io tls',
      metaData: {},
      name: 'ssh',
      target: {
        name: 'securecodebox.io tls',
        location: 'securecodebox.io',
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
      description: 'Deprecated / discouraged SSH key algorithms are used',
      name: 'Insecure SSH Key Algorithms',
      osi_layer: 'NETWORK',
      severity: 'MEDIUM',
    });

    expect(findings).toContainEqual({
      category: 'SSH Policy Violation',
      description: 'Deprecated / discouraged SSH MAC algorithms are used',
      name: 'Insecure SSH MAC Algorithms',
      osi_layer: 'NETWORK',
      severity: 'MEDIUM',
    });

    expect(
      findings
        .filter(({ name }) => name !== 'SSH Service Information')
        .filter(({ name }) => name !== 'Insecure SSH Key Algorithms')
        .filter(({ name }) => name !== 'Insecure SSH MAC Algorithms')
    ).toEqual([]);
  },
  2 * Time.Minute
);

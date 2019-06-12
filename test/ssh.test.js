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

    expect(findings.length).toBe(3);

    expect(findings).toContainEqual({
      category: 'SSH Service',
      description: 'SSH Compliance Information',
      name: 'SSH Compliance',
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
    });

    expect(findings).toContainEqual({
      category: 'SSH Service',
      description: ' diffie-hellman-group14-sha1',
      name: 'Remove these key exchange algorithms',
      osi_layer: 'NETWORK',
      severity: 'MEDIUM',
    });

    expect(findings).toContainEqual({
      category: 'SSH Service',
      description:
        ' umac-64-etm@openssh.com, hmac-sha1-etm@openssh.com, umac-64@openssh.com, hmac-sha1',
      name: 'Remove these MAC algorithms',
      osi_layer: 'NETWORK',
      severity: 'MEDIUM',
    });
  },
  2 * Time.Minute
);

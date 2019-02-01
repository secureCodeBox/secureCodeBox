const { startSecurityTest, Time } = require('./sdk');

test(
  'finds subdomains for securecodebox.io',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'securecodebox.io subdomains',
      metaData: {},
      name: 'amass',
      target: {
        name: 'securecodebox.io',
        location: 'securecodebox.io',
        attributes: {},
      },
    });

    const {
      report: { findings },
    } = securityTest;

    // Should find at least a couple of subdomains
    expect(findings.length).toBeGreaterThan(5);

    // Should all end on "*.securecodebox.io"
    for (const finding of findings) {
      expect(finding.location).toEqual(
        expect.stringMatching(/.*\.securecodebox.io$/)
      );
    }
  },
  5 * Time.Minute
);

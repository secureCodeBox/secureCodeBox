const {scan} = require('../helpers');

test(
  'amass should find at least 1 subdomain',
  async () => {
    // This integration tests runs about 30min because of the GitHub Public API call rate limit.
    // If you want to speed up you need to add an valid access token like: ['--git-type', 'github', '--organization', 'secureCodeBox', '--access-token', '23476VALID2345TOKEN'],
    const {count} = await scan(
      'amass-scanner-dummy-scan',
      'amass',
      ['-passive', '-noalts', '-norecursive', '-d', 'owasp.org'],
      180
    );
    // There must be >= 20 subdomains found for the domain owasp.org.
    expect(count).toBeGreaterThanOrEqual(20);
  },
  3 * 60 * 1000
);

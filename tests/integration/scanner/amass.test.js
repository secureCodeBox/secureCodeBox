const {scan} = require('../helpers');

test(
  'amass should find at least 20 subdomains',
  async () => {
    const {count} = await scan(
      'amass-scanner-dummy-scan',
      'amass',
      ['-passive', '-noalts', '-norecursive', '-d', 'owasp.org'],
      90
    );
    expect(count).toBeGreaterThanOrEqual(20);
  },
  3 * 60 * 1000
);

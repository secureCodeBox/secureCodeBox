const {scan} = require('../helpers');

test(
  'WPScan should find at least 1 finding regarding the old-wordpress demo app',
  async () => {
    const {count} = await scan(
      'wpscan-scanner-dummy-scan',
      'wpscan',
      ['--url', 'old-wordpress.demo-apps.svc'],
      90
    );
    expect(count).toBeGreaterThanOrEqual(1);
  },
  3 * 60 * 1000
);

const {scan} = require('../helpers');

test(
  'gitleaks should find at least 1 repository in the GitHub secureCodeBox organisation',
  async () => {
    const {categories, severities, count} = await scan(
      'git-repo-scanner-dummy-scan',
      'git-repo-scanner',
      ['--git-type', 'github', '--organization', 'secureCodeBox'],
      180
    );
    // There must be >= 28 Repositories found in the GitHub secureCodeBox organisation.
    expect(count).toBeGreaterThanOrEqual(28);
  },
  3 * 60 * 1000
);


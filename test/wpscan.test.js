const { startSecurityTest, Time } = require('./sdk');

test(
  'finds a few findings findings for an older wordpress installation',
  async () => {
    const securityTest = await startSecurityTest({
      context: 'old wordpress',
      metaData: {},
      name: 'wordpress',
      target: {
        name: 'old-wordpress',
        location: 'old-wordpress',
        attributes: {},
      },
    });

    const { report } = securityTest;

    const [finding, ...otherFindings] = report.findings;

    expect(finding).toMatchObject({
      name: 'CMS Wordpress',
      category: 'CMS Wordpress',
      description: 'CMS Wordpress Information',
      location: 'http://old-wordpress/',
      severity: 'INFORMATIONAL',
      osi_layer: 'APPLICATION',
      attributes: {
        version: expect.stringContaining('4.0'),
      },
    });

    expect(otherFindings).toEqual([]);
  },
  7 * Time.Minute
);

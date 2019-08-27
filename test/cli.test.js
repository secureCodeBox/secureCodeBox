const { Time } = require('./sdk');
const child_process = require('child_process');

test(
  'finds open juice-shop ports when started via cli',
  async () => {
    const authstring = `${global.username}:${global.password}`;
    child_process.execSync(
      `./run_scanner.sh -a ${authstring} nmap juice-shop`,
      {
        cwd: '../cli',
      }
    );

    const { report } = require('../cli/job_nmap_result.json');

    const [finding1, finding2, ...otherFindings] = report.findings.map(
      ({ description, category, name, osi_layer, severity }) => ({
        description,
        category,
        name,
        osi_layer,
        severity,
      })
    );

    expect(finding1).toMatchObject({
      description: 'Port 3000 is open using tcp protocol.',
      category: 'Open Port',
      name: 'ppp',
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
    });

    expect(finding2).toMatchObject({
      category: 'Host',
      description: 'Found a host',
      name: 'Host: juice-shop',
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
    });

    expect(otherFindings).toEqual([]);
  },
  1 * Time.Minute
);

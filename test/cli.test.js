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

    expect(report.findings.length).toBe(1);

    expect(report.findings[0].description).toBe(
      'Port 3000 is open using tcp protocol.'
    );
    expect(report.findings[0].category).toBe('Open Port');
  },
  1 * Time.Minute
);

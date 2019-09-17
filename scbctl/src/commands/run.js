const { Command, flags } = require('@oclif/command');
const axios = require('axios');
const execa = require('execa');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
class RunCommand extends Command {
  async run() {
    const { args, argv, flags } = this.parse(RunCommand);

    const { 'scanner-name': scannerName } = args;

    // eslint-disable-next-line no-unused-vars
    const [_, scannerParamsOne, ...otherScannerParams] = argv;
    const scannerParameters = [scannerParamsOne, ...otherScannerParams];

    this.debug(
      `Starting securityTest "${scannerName}" with params "${scannerParameters.join(
        ' '
      )}"`
    );

    axios
      .put('http://localhost:3000/api/v1alpha/scan-job/', {
        jobType: scannerName,
        parameters: scannerParameters,
      })
      .then(async ({ data }) => {
        const { id } = data;

        this.log(`Started securityTest with id: "${id}"`);

        if (flags.logs) {
          const getArgs = [
            'get',
            'pods',
            `--selector=id=${id}`,
            '--output',
            'json',
          ];

          let scannerContainerState = null;

          this.log('Waiting for job container to start');

          do {
            await sleep(100);

            const { stdout } = await execa('kubectl', getArgs);

            this.debug(`$ kubectl ${getArgs.join(' ')}`);

            const output = JSON.parse(stdout);

            if (output.items.length !== 0) {
              const scannerContainers = output.items[0].status.containerStatuses.filter(
                ({ name }) => name === scannerName
              );

              if (scannerContainers.length !== 1) {
                this.warn(
                  `Unexpected scanner container count of ${scannerContainers.length}`
                );
              } else {
                const scannerContainer = scannerContainers[0];

                if (!scannerContainer.state.waiting) {
                  scannerContainerState = 'ready';
                }
              }
            }
          } while (scannerContainerState !== 'ready');

          this.log('Job container started');

          // this.log(`Job is running in Pod ${podId}`);

          const logArgs = [
            'logs',
            '--follow',
            `job/${scannerName}-${id}`,
            scannerName,
          ];
          this.log();
          this.log(`$ kubectl ${logArgs.join(' ')}`);
          this.log();
          const logsProcess = execa('kubectl', logArgs);
          logsProcess.stdout.pipe(process.stdout);
          await logsProcess;

          this.log();
          this.log(`Job completed`);
        }
      })
      .catch(error => {
        if (error.isAxiosError) {
          this.warn('Failed to contact the engine. Is it up?', { exit: 2 });
          process.exit(1);
        } else {
          this.warn('Unknown error');
          // eslint-disable-next-line no-console
          console.error(error);
          process.exit(1);
        }
      });
  }
}

RunCommand.description = `
Start a new securityTest.
All arguments after the Scanner Name will be passed on to the scanner container.
`;

RunCommand.examples = [
  'scbctl run nmap -Pn localhost',
  'scbctl run --logs nmap -Pn localhost',
  'scbctl run nmap -Pn localhost',
  'scbctl run amass -d example.com',
];

RunCommand.strict = false;

RunCommand.args = [
  {
    name: 'scanner-name',
    description:
      'Name of the scanner. A ScanJobDefinition must be deployed with the same name. E.g. nmap',
    required: true,
  },
  {
    name: 'args',
    description:
      'Scanner arguments, passed to the container command. E.g. for nmap "-Pn localhost"',
    required: false,
  },
];

RunCommand.flags = {
  logs: flags.boolean({
    description:
      'Displays the containers log output via kubectl. Requires that your local machine is authenticated in the cluster.',
  }),
};
module.exports = RunCommand;

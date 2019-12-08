const {Command, flags} = require('@oclif/command')
const axios = require('axios')
const execa = require('execa')
const chalk = require('chalk')
const path = require('path')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// From: https://stackoverflow.com/a/14919494
function humanFileSize(bytes) {
  var thresh = 1024
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B'
  }
  var units = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  var u = -1
  do {
    bytes /= thresh
    ++u
  } while (Math.abs(bytes) >= thresh && u < units.length - 1)
  return bytes.toFixed(1) + ' ' + units[u]
}

class RunCommand extends Command {
  async run() {
    const {args, argv, flags} = this.parse(RunCommand)

    const {'scanner-name': scannerName} = args

    // eslint-disable-next-line no-unused-vars
    const [_, scannerParamsOne, ...otherScannerParams] = argv
    const scannerParameters = [scannerParamsOne, ...otherScannerParams]

    this.debug(
      `Starting securityTest "${chalk.default.blue(
        scannerName
      )}" with params "${scannerParameters.join(' ')}"`
    )

    const id = await this.startSecurityTest({
      scannerName,
      scannerParameters,
      tenant: flags.tenant,
    })

    this.log(`🚀 Started securityTest with id: "${chalk.default.grey(id)}"`)

    const scanJobEnvironment = await this.waitForJobToGetLocked({
      securityTestId: id,
    })

    this.log(
      `🔒 ScanJob locked by dispatcher in environment: "${chalk.default.grey(
        scanJobEnvironment
      )}"`
    )

    if (flags.logs) {
      this.log('⏰ Waiting for ScanJob container to start')

      await this.waitForScanJobContainerReadiness({
        scanJobId: id,
        scanJobEnvironment,
        scannerName,
      })

      this.log('🎢 ScanJob container started')

      await this.streamScanJobContainerLogs({
        scanJobId: id,
        scanJobEnvironment,
        scannerName,
      })

      this.log()
      this.log('🏁 ScanJob completed')
    }

    const scanCompletedEvent = await this.waitForScanJobCompletedEvent({
      securityTestId: id,
    })

    this.log('📁 Result files:')
    for (const {fileName, uploadSize} of scanCompletedEvent.attributes
    .files) {
      this.log(
        `   ↳ ${path.basename(fileName)} (${humanFileSize(uploadSize)})`
      )
    }

    this.log()
    this.log('⏰ Waiting for ParseJob to convert the results into findings')

    const parseCompletedEvent = await this.waitForParserToFinishEvent({
      securityTestId: id,
    })

    const {
      findingCount,
      severityOverview,
      categoryOverview,
    } = parseCompletedEvent.attributes

    this.log('🏁 ParseJob completed')
    this.log()
    this.log(`🕵️‍  Identified ${findingCount} findings.`)
    this.log()

    this.log('👩‍⚖️ Severity of the findings:')
    if (severityOverview.INFORMATIONAL) {
      this.log(`   ℹ  Informational: ${severityOverview.INFORMATIONAL}`)
    }
    if (severityOverview.LOW) {
      this.log(`   😕 Low: ${severityOverview.LOW}`)
    }
    if (severityOverview.MEDIUM) {
      this.log(`   😫 Medium: ${severityOverview.MEDIUM}`)
    }
    if (severityOverview.HIGH) {
      this.log(`   🤬 High: ${severityOverview.HIGH}`)
    }

    this.log()
    this.log('📒 Finding Categories:')
    for (const [category, count] of Object.entries(categoryOverview)) {
      this.log(`   - ${category}: ${count}`)
    }
  }

  async startSecurityTest({scannerName, scannerParameters, tenant}) {
    try {
      const {data} = await axios.put(
        'http://localhost:3000/api/v1alpha/scan-job/',
        {
          jobType: scannerName,
          parameters: scannerParameters,
          tenant,
        }
      )

      return data.id
    } catch (error) {
      if (error.isAxiosError) {
        this.warn('Failed to contact the engine. Is it up?')
        process.exit(1)
      } else {
        this.warn('Unknown error')
        // eslint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      }
    }
  }

  async waitForJobToGetLocked({securityTestId}) {
    const MAX_MINUTES_TO_WAIT = 5

    for (let i = 0; i < (MAX_MINUTES_TO_WAIT * 60 * 1000) / 250; i++) {
      const {data} = await axios.get(
        `http://localhost:3000/api/v1alpha/scan-job/${securityTestId}`
      )
      const scanLockedEvents = data.events.filter(
        ({type}) => type === 'Locked'
      )
      if (scanLockedEvents.length !== 0) {
        return scanLockedEvents[0].attributes.dispatcherEnvironmentName
      }
      await sleep(250)
    }

    this.warn(
      `Waited for more than ${MAX_MINUTES_TO_WAIT} minutes for the securityTest to get locked by a dispatcher. This means that either all dispatcher are busy or that no dispatcher can work this job type.`
    )
    this.warn(
      'The Job will stay queued until a dispatcher is ready to pick it up.'
    )
    this.exit(1)
  }

  async waitForScanJobContainerReadiness({
    scanJobId,
    scanJobEnvironment,
    scannerName,
  }) {
    const getArgs = [
      '--context',
      scanJobEnvironment,
      'get',
      'pods',
      `--selector=id=${scanJobId}`,
      '--output',
      'json',
    ]

    const MAX_MINUTES_TO_WAIT = 5

    for (let i = 0; i < (MAX_MINUTES_TO_WAIT * 60 * 1000) / 250; i++) {
      this.debug(`$ kubectl ${getArgs.join(' ')}`)
      const {stdout} = await execa('kubectl', getArgs)

      const output = JSON.parse(stdout)

      if (
        output.items.length !== 0 &&
        output.items[0].status &&
        output.items[0].status.containerStatuses &&
        output.items[0].status.containerStatuses.length !== 0
      ) {
        const scannerContainers = output.items[0].status.containerStatuses.filter(
          ({name}) => name === scannerName
        )

        if (scannerContainers.length === 1) {
          const scannerContainer = scannerContainers[0]

          if (!scannerContainer.state.waiting) {
            return
          }
        } else {
          this.warn(
            `Unexpected scanner container count of ${scannerContainers.length}`
          )
        }
      }
      await sleep(250)
    }

    this.warn(
      `Waited for more than ${MAX_MINUTES_TO_WAIT} minutes for the Scan Container to start up. This might indicate that the cluster isn't able to start up the container.`
    )
    this.exit(1)
  }

  async streamScanJobContainerLogs({
    scanJobId,
    scanJobEnvironment,
    scannerName,
  }) {
    const logArgs = [
      '--context',
      scanJobEnvironment,
      'logs',
      '--follow',
      `job/${scannerName}-${scanJobId}`,
      scannerName,
    ]

    this.log()
    this.log(`$ kubectl ${logArgs.join(' ')}`)
    this.log()

    const logsProcess = execa('kubectl', logArgs)
    logsProcess.stdout.pipe(process.stdout)
    await logsProcess
  }

  async waitForScanJobCompletedEvent({securityTestId}) {
    const MAX_MINUTES_TO_WAIT = 8 * 60

    for (let i = 0; i < (MAX_MINUTES_TO_WAIT * 60 * 1000) / 250; i++) {
      const {data} = await axios.get(
        `http://localhost:3000/api/v1alpha/scan-job/${securityTestId}`
      )
      const scanCompletedEvents = data.events.filter(
        ({type}) => type === 'ScanCompleted'
      )
      if (scanCompletedEvents.length !== 0) {
        return scanCompletedEvents[0]
      }
      await sleep(250)
    }

    this.warn(
      `Waited for more than ${MAX_MINUTES_TO_WAIT} minutes for the ScanJob to be marked completed. Either the scanner is taking a really really long time or something crashed in a unexpected way.`
    )
    this.exit(1)
  }

  async waitForParserToFinishEvent({securityTestId}) {
    const MAX_MINUTES_TO_WAIT = 8 * 60

    for (let i = 0; i < (MAX_MINUTES_TO_WAIT * 60 * 1000) / 250; i++) {
      const {data} = await axios.get(
        `http://localhost:3000/api/v1alpha/scan-job/${securityTestId}`
      )
      const scanCompletedEvents = data.events.filter(
        ({type}) => type === 'ResultsParsed'
      )
      if (scanCompletedEvents.length !== 0) {
        return scanCompletedEvents[0]
      }
      await sleep(250)
    }

    this.warn(
      `Waited for more than ${MAX_MINUTES_TO_WAIT} minutes for the ParseJob to return its result`
    )
    this.exit(1)
  }
}

RunCommand.description = `
Start a new securityTest.
All arguments after the Scanner Name will be passed on to the scanner container.
`

RunCommand.examples = [
  'scbctl run nmap -Pn localhost',
  'scbctl run --logs nmap -Pn localhost',
  'scbctl run nmap -Pn localhost',
  'scbctl run amass -d example.com',
  'scbctl run --tenant team42 nmap example.com',
]

RunCommand.strict = false

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
]

RunCommand.flags = {
  logs: flags.boolean({
    description:
      'Displays the containers log output via kubectl. Requires that your local machine is authenticated in the cluster.',
  }),
  tenant: flags.string({
    description:
      'Starts the SecurityTest to be related to a particular tenant. The Dispatcher needs to math the same tenant to be able to work on this SecurityTest.',
    default: 'default',
  }),
}
module.exports = RunCommand

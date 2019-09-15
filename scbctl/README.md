scbctl
======

secureCodeBox CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/scbctl.svg)](https://npmjs.org/package/scbctl)
[![Downloads/week](https://img.shields.io/npm/dw/scbctl.svg)](https://npmjs.org/package/scbctl)
[![License](https://img.shields.io/npm/l/scbctl.svg)](https://github.com/secureCodeBox/scbctl/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g scbctl
$ scbctl COMMAND
running command...
$ scbctl (-v|--version|version)
scbctl/0.1.0 darwin-x64 node-v10.16.0
$ scbctl --help [COMMAND]
USAGE
  $ scbctl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`scbctl help [COMMAND]`](#scbctl-help-command)
* [`scbctl run SCANNER-NAME [ARGS]`](#scbctl-run-scanner-name-args)

## `scbctl help [COMMAND]`

display help for scbctl

```
USAGE
  $ scbctl help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `scbctl run SCANNER-NAME [ARGS]`

Start a new securityTest.

```
USAGE
  $ scbctl run SCANNER-NAME [ARGS]

ARGUMENTS
  SCANNER-NAME  Name of the scanner. A ScanJobDefinition must be deployed with the same name. E.g. nmap
  ARGS          Scanner arguments, passed to the container command. E.g. for nmap "-Pn localhost"

OPTIONS
  --logs  Displays the containers log output via kubectl. Requires that your local machine is authenticated in the
          cluster.

DESCRIPTION
  Start a new securityTest.
  All arguments after the Scanner Name will be passed on to the scanner container.

EXAMPLES
  scbctl run nmap -Pn localhost
  scbctl run --logs nmap -Pn localhost
  scbctl run nmap -Pn localhost
  scbctl run amass -d example.com
```

_See code: [src/commands/run.js](https://github.com/secureCodeBox/scbctl/blob/v0.1.0/src/commands/run.js)_
<!-- commandsstop -->

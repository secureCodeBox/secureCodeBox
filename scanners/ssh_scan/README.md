---
title: "SSH"
path: "scanners/ssh"
category: "scanner"
type: "SSH"
state: "released"
appVersion: "0.0.43"
usecase: "SSH Configuration and Policy Scanner"
---

SSH_scan is an easy-to-use prototype SSH configuration and policy scanner, inspired by Mozilla OpenSSH Security Guide, which provides a reasonable baseline policy recommendation for SSH configuration parameters such as Ciphers, MACs, and KexAlgos and much more.

To learn more about the ssh_scan scanner itself visit [ssh_scan GitHub].

<!-- end -->

## Deployment

The SSH_scan ScanType can be deployed via helm.

```bash
helm upgrade --install ssh ./scanners/ssh_scan/
```

## Examples

A set of examples can be found in the [examples](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/tree/master/scanners/ssh_scan/examples) folder.

* Example *example.com* [scan](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/ssh_scan/examples/example.com/scan.yaml)
* Example *localhost* [scan](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/ssh_scan/examples/localhost/scan.yaml) and [findings](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/ssh_scan/examples/localhost/findings.yaml)

## Configuration

The following security scan configuration example are based on the [ssh_scan Documentation], please take a look at the original documentation for more configuration examples.

```bash
ssh_scan v0.0.21 (https://github.com/mozilla/ssh_scan)

Usage: ssh_scan [options]
    -t, --target [IP/Range/Hostname] IP/Ranges/Hostname to scan
    -f, --file [FilePath]            File Path of the file containing IP/Range/Hostnames to scan
    -T, --timeout [seconds]          Timeout per connect after which ssh_scan gives up on the host
    -L, --logger [Log File Path]     Enable logger
    -O, --from_json [FilePath]       File to read JSON output from
    -o, --output [FilePath]          File to write JSON output to
    -p, --port [PORT]                Port (Default: 22)
    -P, --policy [FILE]              Custom policy file (Default: Mozilla Modern)
        --threads [NUMBER]           Number of worker threads (Default: 5)
        --fingerprint-db [FILE]      File location of fingerprint database (Default: ./fingerprints.db)
        --suppress-update-status     Do not check for updates
    -u, --unit-test [FILE]           Throw appropriate exit codes based on compliance status
    -V [STD_LOGGING_LEVEL],
        --verbosity
    -v, --version                    Display just version info
    -h, --help                       Show this message

Examples:

  ssh_scan -t 192.168.1.1
  ssh_scan -t server.example.com
  ssh_scan -t ::1
  ssh_scan -t ::1 -T 5
  ssh_scan -f hosts.txt
  ssh_scan -o output.json
  ssh_scan -O output.json -o rescan_output.json
  ssh_scan -t 192.168.1.1 -p 22222
  ssh_scan -t 192.168.1.1 -p 22222 -L output.log -V INFO
  ssh_scan -t 192.168.1.1 -P custom_policy.yml
  ssh_scan -t 192.168.1.1 --unit-test -P custom_policy.yml
```

## Development

### Local setup

1. Clone the repository `git clone git@github.com:secureCodeBox/secureCodeBox-v2-alpha.git`
2. Ensure you have node.js installed
   * On MacOs with brew package manager: `brew install node`

### Parser Development

1. Install the dependencies `npm install`
2. Update the parser function here: `./parser/parser.js`
3. Update the parser tests here: `./parser/parser.test.js`
4. Run the test suite: `npm test`

[ssh_scan GitHub]: https://github.com/mozilla/ssh_scan
[ssh_scan Documentation]: https://github.com/mozilla/ssh_scan#example-command-line-usage

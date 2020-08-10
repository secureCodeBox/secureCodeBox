---
title: "Nmap"
path: "scanners/nmap"
category: "scanner"
type: "Network"
state: "released"
appVersion: 7.80
usecase: "Network Scanner"
---

![Nmap logo](https://nmap.org/images/sitelogo.png)

Nmap ("Network Mapper") is a free and open source (license) utility for network discovery and security auditing. Many systems and network administrators also find it useful for tasks such as network inventory, managing service upgrade schedules, and monitoring host or service uptime.

To learn more about the Nmap scanner itself visit [nmap.org].

<!-- end -->

## Deployment

The Nmap ScanType can be deployed via helm:

```bash
helm install nmap ./scanners/nmap/
```

## Examples

A set of examples can be found in the [examples](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/tree/master/scanners/nmap/examples) folder.

* Example *local-network* [scan](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/nmap/examples/local-network/scan.yaml) and [findings](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/nmap/examples/local-network/findings.yaml)
* Example *localhost* [scan](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/nmap/examples/localhost/scan.yaml) and [findings](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/nmap/examples/localhost/findings.yaml)
* Example *scan.nmap.org* [scan](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/nmap/examples/scan.nmap.org/scan.yaml) and [findings](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/nmap/examples/scan.nmap.org/findings.yaml)

## Nmap Configuration

The nmap scan target is set via the targets location of the securityTest. The target should be a Hostname or an IP Address.

Additional nmap scan features can be configured via the parameter attribute. For a detailed explanation to which parameters are available refer to the [Nmap Reference Guide](https://nmap.org/book/man.html). All parameters are supported, but be careful with parameters that require root level rights, as these require additional configuration on the ScanType to be supported.

Some useful example parameters listed below:

- `-p` xx: Scan ports of the target. Replace xx with a single port number or
  a range of ports.
- `-PS`, `-PA`, `-PU` xx: Replace xx with the ports to scan. TCP SYN/ACK or
  UDP discovery.
- `-sV`: Determine service and version info.
- `-O`: Determine OS info. **Note:** This requires the the user to be run as root or the system capabilities to be extended to allow nmap to send raw sockets. See more information on [how to deploy the secureCodeBox nmap container to allow this](https://github.com/secureCodeBox/scanner-infrastructure-nmap/pull/20) and the [nmap docs about priviliged scans](https://secwiki.org/w/Running_nmap_as_an_unprivileged_user)
- `-A`: Determine service/version and OS info.
- `-script` xx: Replace xx with the script name. Start the scan with the given script.
- `--script` xx: Replace xx with a coma-separated list of scripts. Start the scan with the given scripts.

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

#### Basic scanner tests

If you want to test sslyze localy you can use brew (only on macOS) to install it: `brew install nmap`

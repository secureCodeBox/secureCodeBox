---
title: "SSLyze"
path: "scanner/SSLyze"
category: "scanner"
usecase: "SSL/TLS Configuration Scanner"
---

SSLyze is a Python library and a CLI tool that can analyze the SSL configuration of a server by connecting to it. It is designed to be fast and comprehensive, and should help organizations and testers identify mis-configurations affecting their SSL/TLS servers. To learn more about the SSLyze scanner itself visit or [SSLyze GitHub].

<!-- end -->

## Deployment

The SSLyze scanType can be deployed via helm.

```bash
helm upgrade --install sslyze ./integrations/sslyze/
```

## Examples

A set of examples can be found in the [examples](./examples) folder.
* Example *secureCodeBox.io* [scan](./examples/secureCodeBox.io/scan.yaml) and [findings](./examples/secureCodeBox.io/findings.yaml)
* Example *example.com* [scan](./examples/secureCodeBox.io/scan.yaml) and [findings](./examples/secureCodeBox.io/findings.yaml)

## Configuration

The follwing security scan configuration example are based on the [SSLyze Documentation], please take a look at the original documentation for more configuration examples.

The command line interface can be used to easily run server scans: `sslyze --regular www.example.com`

## Development

### Local setup
1. Clone the repository `git clone git@github.com:secureCodeBox/secureCodeBox-v2-alpha.git`
2. Ensure you have node.js installed
   * On MacOs with brew package manager: `brew install node`

### Parser Development

1. Install the dependencies `npm install`
2. Update the parser function here: `./parser/parser.js`
3. Update the parser tests here: `./parser/parser.test.js`
4. Run the testsuite: `npm test`

[SSLyze GitHub]: https://github.com/nabla-c0d3/sslyze
[SSLyze Documentation]: https://nabla-c0d3.github.io/sslyze/documentation/
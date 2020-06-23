---
title: "Trivy"
path: "scanners/trivy"
category: "scanner"
usecase: "Containers Vulnerability Scanner"
---

`Trivy` (`tri` pronounced like **tri**gger, `vy` pronounced like en**vy**) is a simple and comprehensive vulnerability scanner for containers and other artifacts.
A software vulnerability is a glitch, flaw, or weakness present in the software or in an Operating System.
`Trivy` detects vulnerabilities of OS packages (Alpine, RHEL, CentOS, etc.) and application dependencies (Bundler, Composer, npm, yarn, etc.).
`Trivy` is easy to use. Just install the binary and you're ready to scan. All you need to do for scanning is to specify a target such as an image name of the container.

To learn more about the Trivy scanner itself visit or [Trivy GitHub].

<!-- end -->

## Deployment

The Trivy scanType can be deployed via helm:

```bash
helm upgrade --install trivy ./scanners/trivy/
```

## Examples

A set of examples can be found in the [examples](./examples) folder.

* Example *juice-shop* [scan](./examples/juice-shop/scan.yaml) and [findings](./examples/juice-shop/findings.yaml)
* Example *mediawiki* [scan](./examples/mediawikip/scan.yaml) and [findings](./examples/mediawiki/findings.yaml)

## Configuration

The following security scan configuration example are based on the [Trivy Documentation], please take a look at the original documentation for more configuration examples.

* Filter the vulnerabilities by severities `trivy image --severity HIGH,CRITICAL ruby:2.4.0`
* Filter the vulnerabilities by type (`os` or `library`) `trivy image --vuln-type os ruby:2.4.0`
* Skip update of vulnerability DB: `trivy image --skip-update python:3.4-alpine3.9`
* Ignore unfixed vulnerabilities:`trivy image --ignore-unfixed ruby:2.4.0` By default, Trivy also detects unpatched/unfixed vulnerabilities. This means you can't fix these vulnerabilities even if you update all packages. If you would like to ignore them, use the `--ignore-unfixed` option.

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

[Trivy GitHub]: https://github.com/aquasecurity/trivy
[Trivy Documentation]: https://github.com/aquasecurity/trivy#examples

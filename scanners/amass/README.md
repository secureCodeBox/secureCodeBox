---
title: "Amass"
path: "scanners/amass"
category: "scanner"
type: "Network"
state: "released"
appVersion: 3.7.2
usecase: "Subdomain Enumeration Scanner"
---

![owasp logo](https://owasp.org/assets/images/logo.png)

The OWASP Amass Project has developed a tool to help information security professionals perform network mapping of attack surfaces and perform external asset discovery using open source information gathering and active reconnaissance techniques. To learn more about the Amass scanner itself visit [OWASP_Amass_Project] or [Amass GitHub].

<!-- end -->

## Deployment

The AMASS scanType can be deployed via helm:

```bash
helm upgrade --install amass ./scanners/amass/
```

## Examples

A set of examples can be found in the [examples](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/tree/master/scanners/amass/examples) folder.

* Example *secureCodeBox.io* [scan](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/amass/examples/secureCodeBox.io/scan.yaml)
* Example *example.com* [scan](https://github.com/secureCodeBox/secureCodeBox-v2-alpha/blob/master/scanners/amass/examples/example.com/scan.yaml)

## Configuration

The following security scan configuration example are based on the [Amass User Guide], please take a look at the original documentation for more configuration examples.

* The most basic use of the tool for subdomain enumeration: `amass enum -d example.com`
* Typical parameters for DNS enumeration: `amass enum -v -src -ip -brute -min-for-recursive 2 -d example.com`

Special command line options:

* Disable generation of altered names	`amass enum -noalts -d example.com`
* Turn off recursive brute forcing	`amass enum -brute -norecursive -d example.com`
* Disable saving data into a local database	`amass enum -nolocaldb -d example.com`
* Domain names separated by commas (can be used multiple times)	`amass enum -d example.com`

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

[OWASP_Amass_Project]: https://owasp.org/www-project-amass/
[Amass GitHub]: https://github.com/OWASP/Amass
[Amass User Guide]: https://github.com/OWASP/Amass/blob/master/doc/user_guide.md

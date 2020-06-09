---
title: "kube-hunter"
path: "scanner/kube-hunter"
category: "scanner"
usecase: "Kubernetes Vulnerability Scanner"
---

kube-hunter hunts for security weaknesses in Kubernetes clusters. The tool was developed to increase awareness and visibility for security issues in Kubernetes environments. You should NOT run kube-hunter on a Kubernetes cluster that you don't own!

To learn more about the kube-hunter scanner itself visit [kube-hunter GitHub] or [kube-hunter Website].

<!-- end -->

## Deployment

The kube-hunter ScanType can be deployed via helm.

```bash
helm upgrade --install kube-hunter ./integrations/kube-hunter/
```

## Examples

A set of examples can be found in the [examples](./examples) folder.
* Example *in-cluster* [scan](./examples/in-cluster/scan.yaml) and [findings](./examples/in-cluster/findings.yaml)

## Configuration

The follwing security scan configuration example are based on the [kube-hunter Documentation], please take a look at the original documentation for more configuration examples.

* To specify remote machines for hunting, select option 1 or use the --remote option. Example: `kube-hunter --remote some.node.com`
* To specify interface scanning, you can use the --interface option (this will scan all of the machine's network interfaces). Example: `kube-hunter --interface`
* To specify a specific CIDR to scan, use the --cidr option. Example: `kube-hunter --cidr 192.168.0.0/24`

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

[kube-hunter Website]: https://kube-hunter.aquasec.com/
[kube-hunter GitHub]: https://github.com/aquasecurity/kube-hunter
[kube-hunter Documentation]: https://github.com/aquasecurity/kube-hunter#scanning-options
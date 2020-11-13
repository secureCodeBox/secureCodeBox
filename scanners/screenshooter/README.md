---
title: "Screenshooter"
category: "scanner"
type: "Application"
state: "not released"
usecase: "Takes Screenshots of websites"
---
![firefox logo](https://3u26hb1g25wn1xwo8g186fnd-wpengine.netdna-ssl.com/files/2019/10/logo-firefox.svg)

This integration takes screenshots of websites. This can be extremely helpful when you are using the secureCodeBox to scan a large number of services and want to get a quick visual overview of each service.

<!-- end -->

## Deployment

The scanType can be deployed via helm.

```bash
helm upgrade --install screenshooter ./scanners/screenshooter/
```

## Examples

A set of examples can be found in the [examples](./examples) folder.

- Example _secureCodeBox.io_ [scan](./examples/secureCodeBox.io/scan.yaml) and [findings](./examples/secureCodeBox.io/findings.yaml)
- Example _example.com_ [scan](./examples/secureCodeBox.io/scan.yaml) and [findings](./examples/secureCodeBox.io/findings.yaml)

## Development

### Local setup

1. Clone the repository `git clone git@github.com:secureCodeBox/secureCodeBox-v2-alpha.git`
2. Ensure you have node.js installed
   - On MacOs with brew package manager: `brew install node`

### Parser Development

1. Install the dependencies `npm install`
2. Update the parser function here: `./parser/parser.js`
3. Update the parser tests here: `./parser/parser.test.js`
4. Run the testsuite: `npm test`

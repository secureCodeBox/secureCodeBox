---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Integrating A New Scanner"
sidebar_position: 1
---

In the _secureCodeBox_ we created new _Custom Resource Definitions_ (CRD) for Kubernetes to manage scanners (_ScanType_) and hooks (see [Custom Resource Definitions](/docs/api/crds)).
To add a new Scanner you need to add a new _ScanType_ (see [ScanType](/docs/api/crds/scan-type)) and a parser for its results.

The directory structure of a scanner Helm Chart will look something like this:

```bash
scanners/nmap
├── cascading-rules
│   └── ...
├── docs
│   ├── README.ArtifactHub.md
│   ├── README.DockerHub-Parser.md
│   └── README.DockerHub-Scanner.md
├── examples
│   ├── demo-target-ssh
│   │   ├── findings.yaml
│   │   ├── nmap-results.xml
│   │   └── scan.yaml
│   └── ...
├── parser
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── parser.js
│   ├── parser.test.js
│   └── __testFiles__
│       └── ...
├── templates
│   ├── cascading-rules.yaml
│   ├── nmap-parse-definition.yaml
│   └── nmap-scan-type.yaml
├── scanner
│   └── Dockerfile
├── Chart.yaml
├── values.yaml
├── Makefile
├── README.md
├── .helm-docs.gotmpl
├── .helmignore
└── .gitignore
```

To create a new Helm Chart for your scanner you can use the following command (replace _new-scanner_ with the name of the scanner):

```bash
make create-new-scanner NAME=new-scanner
```

This command will create a new directory named _new-scanner_ and some template files provided by `helm` to simplify the creation of Helm Charts (see [Helm | Getting Started](https://helm.sh/docs/chart_template_guide/getting_started/)).

The following pages describe the purpose of all files and how to configure them.

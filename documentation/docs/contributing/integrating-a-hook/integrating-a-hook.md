---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Integrating A New Hook"
sidebar_position: 1
---

In the _secureCodeBox_ we created new _Custom Resource Definitions_ (CRD) for Kubernetes to manage scanners (_ScanType_) and hooks (see [Custom Resource Definitions](/docs/api/crds)).
To add a new Hook you need to add a new _ScanCompletionHook_ (see [ScanCompletionHook](/docs/api/crds/scan-completion-hook)).

In the _secureCodeBox_ we use Helm Charts for all our Resources to make the installation of new scanners/hooks as easy as possible and enable us to install only the scanners/hooks we actually need.
The directory structure of a hook Helm Chart will look something like this:

```bash
├── docs
│   ├── README.ArtifactHub.md
│   └── README.DockerHub-Hook.md
├── hook
│   ├── Dockerfile
│   ├── hook.js
│   ├── hook.test.js
│   ├── package.json
│   ├── package-lock.json
│   └── .dockerignore
├── templates
│   ├── finding-post-processing-hook.yaml
│   ├── _helpers.tpl
│   └── NOTES.txt
├── Chart.yaml
├── values.yaml
├── Makefile
├── README.md
├── .helm-docs.gotmpl
├── .helmignore
└── .gitignore
```

To create a new Helm Chart for your hook you can use the following command (replace _new-hook_ with the name of the hook):

```bash
helm create new-hook
```

This command will create a new directory named _new-hook_ and some template files provided by `helm` to simplify the creation of Helm Charts (see [Helm | Getting Started](https://helm.sh/docs/chart_template_guide/getting_started/)).

The following pages describe the purpose of all files and how to configure them.

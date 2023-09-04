---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Chart.yaml
sidebar_position: 1
---

The `Chart.yaml` is a basic description of your scanner helm chart and will look something like the following:

```yaml
apiVersion: v2
name: new-scanner
description: A Helm chart for Kubernetes

# A chart can be either an 'application' or a 'library' chart.
#
# Application charts are a collection of templates that can be packaged into versioned archives
# to be deployed.
#
# Library charts provide useful utilities or functions for the chart developer. They're included as
# a dependency of application charts to inject those utilities and functions into the rendering
# pipeline. Library charts do not define any templates and therefore cannot be deployed.
type: application

# This is the chart version. This version number should be incremented each time you make changes
# to the chart and its templates, including the app version.
# Versions are expected to follow Semantic Versioning (https://semver.org/)
version: 0.1.0

# This is the version number of the application being deployed. This version number should be
# incremented each time you make changes to the application. Versions are not expected to
# follow Semantic Versioning. They should reflect the version the application is using.
appVersion: 1.16.0
```

## apiVersion

The `apiVersion` sets the used Chart API version of Helm.
You won't have to change this field.

## name

The `name` field should be set to the name of the scanner.
You won't have to change this field.

## description

Please change the `description` field to explain the basic purpose of your scanner.
For _WPScan_ the `description` would be:

```yaml
description: A Helm chart for the WordPress security scanner that integrates with the secureCodeBox.
```

## version and appVersion

The fields for `version` will be set automatically by our release process.
The `appVersion` should be set to the Version of the scanner. If the scanner does not use versions please use `latest`.
Please set both values:

```yaml
version: latest
appVersion: latest
```

## kubeVersion

The `kubeVersion` references the version of kubernetes that is required to run your Helm Chart.
Please add `kubeVersion` with the value `">=v1.11.0-0"`

```yaml
kubeVersion: ">=v1.11.0-0"
```

## keywords

The `keywords` field makes it possible to specify a list of keywords about this project.
For the WPScan `keywords` would look the following:

```yaml
keywords:
  - security
  - wpscan
  - wordpress
  - scanner
  - secureCodeBox
```

## home

The `home` field should be set to the home page of the project.
For WPScan this would be:

```yaml
home: https://www.securecodebox.io/docs/scanners/WPScan
```

## icon

The `icon` field should be set to the URL to a SVG or PNG (if existing).
For WPScan `icon` would look the following:

```yaml
icon: https://www.securecodebox.io/img/integrationIcons/WPScan.svg
```

## sources

The `sources` field should be set the the URL of the _secureCodeBox_ repository:

```yaml
sources:
  - https://github.com/secureCodeBox/secureCodeBox
```

## maintainers

The `maintainers` field should contain the following values:

```yaml
maintainers:
  - name: iteratec GmbH
  - email: secureCodeBox@iteratec.com
```

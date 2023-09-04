---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Chart.yaml
sidebar_position: 1
---

The `Chart.yaml` is a basic description of your hook helm chart and will look something like the following:

```yaml
apiVersion: v2
name: finding-post-processing
description: Lets you add or override a field to every finding that meets specified conditions

type: application

# version - gets automatically set to the secureCodeBox release version when the helm charts gets published
version: latest
kubeVersion: ">=v1.11.0-0"

dependencies: []
```

The full documentation for helms `Chart.yaml` file can be found [here in the helm docs](https://helm.sh/docs/topics/charts/#the-chartyaml-file).

## apiVersion

The `apiVersion` sets the used Chart API version of Helm.
You won't have to change this field.

## name

The `name` field should be set to the name of the hook.
You won't have to change this field.

## description

Please change the `description` field to explain the basic purpose of your hook.
For _generic-webhook_ the `description` would be:

```yaml
description: Let's you send http webhooks after scans are completed
```

## version and appVersion

The fields for `version` will be set automatically by our release process.
Please set both values to `latest` for this purpose:

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

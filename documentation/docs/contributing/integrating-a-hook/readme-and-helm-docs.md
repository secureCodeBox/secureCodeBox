---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: README.md And .helm-docs.gotmpl
sidebar_position: 7
---

You may have noticed that all our hooks provide a `README.md` as well as a `.helm-docs.gotmpl`.
The reason for this is that we want to provide the documentation of our Helm values directly in our `README.md`.
To avoid the need to do this task manually we use a tool that creates a table with all our values directly from our `values.yaml`.
Therefore there is no need to make any changes on the `README.md` it self.
Every change has to be made in the `.helm-docs.gotmpl` file.

The `.helm-docs.gotmpl` should contain basic information about your hook like its purpose, how it is deployed, how it is configured as well as its Chart configurations generated out of the `values.yaml`.
For example the `.helm-docs.gotmpl` for _WPScan_ looks like this:

```markdown
---
title: "Generic WebHook"
category: "hook"
type: "integration"
state: "released"
usecase: "Publishes Scan Findings as WebHook."
---

<!-- end -->

This Hook will make a request to the specified `webhookUrl` containing the findings in its request body.

## Deployment

Installing the Generic WebHook hook will add a ReadOnly Hook to your namespace.
Change `webhookUrl` to your desired endpoint.

helm upgrade --install gwh secureCodeBox/generic-webhook --set webhookUrl="http://example.com/my/webhook/target"

## Chart Configuration

{{ template "chart.valuesTable" . }}
```

If you want to generate the `README.md` out of your `.helm-docs.gotmpl` locally, you can use `helm-docs` (see: [https://github.com/norwoodj/helm-docs/](https://github.com/norwoodj/helm-docs/)).

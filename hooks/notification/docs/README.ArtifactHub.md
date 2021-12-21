<!--
SPDX-FileCopyrightText: 2021 iteratec GmbH

SPDX-License-Identifier: Apache-2.0
-->
<!--
.: IMPORTANT! :.
--------------------------
This file is generated automatically with `helm-docs` based on the following template files:
- ./.helm-docs/templates.gotmpl (general template data for all charts)
- ./chart-folder/.helm-docs.gotmpl (chart specific template data)

Please be aware of that and apply your changes only within those template files instead of this file.
Otherwise your changes will be reverted/overwritten automatically due to the build process `./.github/workflows/helm-docs.yaml`
--------------------------
-->

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"/></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Incubator Project" src="https://img.shields.io/badge/OWASP-Incubator%20Project-365EAA"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://docs.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://docs.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://docs.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://docs.securecodebox.io/docs/getting-started/first-scans) with it.

## What is "Notification" Hook about?
Installing the Notification WebHook hook will add a ReadOnly Hook to your namespace which is capable of sending scan results containing `findings` as messages to different tools like messangers or even email.

You can customise the message templates on your behalf or use the already provided one.

## Deployment
The notification chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install notification secureCodeBox/notification
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations

Installing the Notification hook will add a ReadOnly Hook to your namespace.

```bash
helm upgrade --install nwh ./hooks/notification-hook/ --values /path/to/your/values"
```

The `values.yaml` you need depends on the notification type you want to use.
Please take a look at the documentation for each type (e.g. for slack see [Configuration of a Slack Notification](#configuration-o-a-slack-notification))

### Available Notifier

- [Slack](#configuration-of-a-slack-notification)
- [Slack App](#configuration-of-a-slack-app-notification)
- [Email](#configuration-of-an-email-notification)
- [MS Teams](#configuration-of-a-ms-teams-notification)

### Configuration of a Notification

The general configuration of a notification looks something like this

```yaml
notificationChannels:
  - name: slack
    type: slack
    template: slack-messageCard
    skipNotificationOnZeroFinding: true
    rules:
      - matches:
          anyOf:
            - category: "Open Port"
    endPoint: "SOME_ENV"

env:
  - name: SOME_ENV
    valueFrom:
      secretRefKey:
        secret: some-secret
        key: some-key
```

The Notification Hook enables you to define multiple so called `notificationChannels`. A `notificationChannel` defines the Notification to a specific platform (e.g. Slack or Teams).

The `name` is used to for debugging failing notifications.
it can be a _string_ of you choice.

The `type` specifies the type of the notification (in this example slack).
See [Available Notifier](#available-notifier).

The `template` field defines the name of a Nunjucks template to send to your notification channel.
These templates are usually tied to their notification channel (slack templates will not work for teams).
The template `slack-messageCard` is provided by default.
Notice that for the name of the template we chose to omit the file type.
The template `slack-messageCard` will point to `slack-messageCard.njk` in the filesystem of the hook.

The `skipNotificationOnZeroFindings` if set to true will cause the notifier when there were no findings.
This can happen when the scan did not identify any or if all findings were filtered out using [rules](#rule-configuration).
Defaults to `false` if not set.
You can use `skipNotificationOnZeroFindings` to only send out notification for non duplicate findings, e.g. by combining the DefectDojo hook with this one and filtering out the `duplicate` attribute in the rules.

The `endPoint` specifies where the notification has to go to.
To protect the actual endPoint (e.g. a webhook url) this should point to an env name defined under `env`
For slack this would be your webhook URL to slack.

To define conditions when a notification should be created you can use `rules`.
If no rules are specified, this hook will assume that you always want to be notified.

Under `env` you have to define additional information needed for your templates such as the actual endpoint.
`env` will be mapped to the `env` implementation of Kubernetes.
This means that you can define key-value pairs as well as providing envs via secrets (See [Define Environment Variables for a Container | Kubernetes](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)).

#### Rule Configuration

The rules can be defined in the values of the Chart.
The syntax and semantic for these rules are quite similar to CascadingRules (See: [secureCodeBox | CascadingRules](/docs/api/crds/cascading-rule))
To define Rules you will have to provide the `rules` field with one or more `matches` elements.
Each `matches` defines one Rule.
For example:

```yaml
rules:
  - matches:
      anyOf:
        - category: "Open Port"
          attributes:
            port: 23
            state: open
```

This Rule will match all Findings with an open port on 23.

##### matches

Within the `matches` you will have to provide `anyOf`
`anyOf` contains one or more conditions to be met by the finding to match the rule.
Notice that only one of these elements needs to match the finding for the rule to match.

#### Configuration of a Slack Notification (WebHook)

To configure a Slack notification set the `type` to `slack` and the `endPoint` to point to your env containing your Webhook URL to slack.
You can use one of the following default templates:

- `slack-messageCard`: Sends a message with a summary listing the number of findings per category and severity.
- `slack-individual-findings-with-defectdojo`: Sends a message with a list of all findings with a link to the finding in DefectDojo. Will only work correctly if the DefectDojo hook is installed in the same namespace.

##### Example Config

The below example shows how to create a helm values chart and load secrets for access.
You must have `endPoint` point to a [defined environment variable](https://github.com/secureCodeBox/secureCodeBox/blob/main/hooks/notification/hook/hook.ts#L20), not a string.

```
# cat myvalues.yaml

notificationChannels:
  - name: nmapopenports
    type: slack
    template: slack-messageCard
    skipNotificationOnZeroFinding: true
    rules:
      - matches:
          anyOf:
            - category: "Open Port"
    endPoint: POINTER_TO_ENV
env:
    - name: POINTER_TO_ENV
      valueFrom:
        secretKeyRef:
            name: myslacksecret
            key: SLACK_WEB_HOOK

# cat values_slack_secrets.yaml
apiVersion: v1
kind: Secret
metadata:
    name: myslacksecret
type: Opaque
data:
    SLACK_WEB_HOOK: NOIDONTHINKSOBASE64STUFF

kubectl apply -f values_slack_secrets.yaml
helm upgrade --install nwh secureCodeBox/notification-hook --values myvalues.yaml
```

#### Configuration of a Slack App Notification

The `slack-app` notifier is an _alternate_ way to send notifications to slack using the slack api directly rather then using webhooks.
Use `slack-app` over the normal `slack` if you want to send notifications into different slack channels on a per scan basis.

##### Slack App Configuration

To set it up, you'll need to create a new slack app at [https://api.slack.com/apps/](https://api.slack.com/apps/) and add the `chat:write` "Bot Token Scope" to it on the "OAuth & Permissions" tab. Then add the bot to your workspace, this will give you the access token (should begin with a `xoxb-`).

To configure a Slack notification set the `type` to `slack-app` and reference the secret via the `SLACK_APP_TOKEN` env var.

##### Example Config

```yaml
notificationChannels:
  - name: slack
    type: slack-app
    template: slack-messageCard
    rules: []

env:
  # you can create the secret via: kubectl create secret generic slack-app-token --from-literal="token=xoxb-..."
  - name: SLACK_APP_TOKEN
    valueFrom:
      secretKeyRef:
        name: slack-app-token
        key: token
  # configures which channel the messages are send to if the scan doesn't specify a channel
  - name: SLACK_DEFAULT_CHANNEL
    value: "#example-channel"
```

##### Supported Notification Channels

The `slack-app` notifier supports the same message templates as the `slack` notifier.
See [slack](#configuration-of-a-slack-notification) for the supported message types.

##### Scan / Channel Config

You can configure to which channel the message is sent to by setting the `notification.securecodebox.io/slack-channel` to the channel the message should be sent to, the following example will send its notifications to the `#juice-shop-dev` channel in the slack workspace of the configured token.

> Note: The channel needs to have the app you've create invited to it. Otherwise the app will not be permitted to write to it.

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "nmap-juice-shop"
  annotations:
    notification.securecodebox.io/slack-channel: "#juice-shop-dev"
spec:
  scanType: "nmap"
  parameters:
    - juice-shop.default.svc
```

#### Configuration Of An Email Notification

To configure an email notification set the `type` to `email` and the `endPoint` to point to your env containing your target email address.
You can use one of the following default templates:

- `email`: Sends a email with a summary listing the number of findings per category and severity.

Additional to this configuration you will have to provide a special smtp configuration URL.
This config reflects the transporter configuration of nodemailer (See [nodemailer | SMTP Transport](https://nodemailer.com/smtp/)).
This configuration needs to be specified under `env` in the values yaml.
The identifier for this config has to be `SMTP_CONFIG`.
A basic configuration could look like this:

```yaml
notificationChannels:
  - name: email
    type: email
    template: email
    rules: []
    endPoint: "someone@somewhere.xyz"
env:
  - name: SMTP_CONFIG
    value: "smtp://user:pass@smtp.domain.tld/"
```

To provide a custom `from` field for your email you can specify `EMAIL_FROM` under env.
For example:

```
env:
  - name: SMTP_CONFIG
    value: "smtp://user:pass@smtp.domain.tld/"
  - name: EMAIL_FROM
    value: secureCodeBox
```

#### Configuration Of A MS Teams Notification

To configure a MS Teams notification you need to set the type to `ms-teams`.
In `endPoint` you need to specify the MS Teams webhook.
To use the template provided by the secureCodeBox set template to `msteams-messageCard`.

The default template allows you to specify an additional set of information.
If you use an external web based vulnerability management system with some kind of dashboard, you can set the variable `VULNMANAG_ENABLED` to true and point the `VULNMANAG_DASHBOARD_URL` to the URL of your vulnerability management.
This will add a button in the notification that links directly to your dashboard.
You can also add a button that opens your findings directly in your dashboard.
To do this you need to specify `dashboardFingingsUrl`.
You will have to replace the id of the scan in this url with `{{ uid }}` so that nunjucks can parse these urls.

A basic configuration could look like this:

```yaml
notificationChannels:
  - name: ms-teams
    type: ms-teams
    template: msteams-messageCard
    rules: []
    endPoint: "https://somewhere.xyz/sadf12"
env:
  - name: VULNMANAG_ENABLED
    value: true
  - name: VULNMANAG_DASHBOARD_URL
    value: "somedashboard.url"
  - name: VULNMANAG_DASHBOARD_FINDINGS_URL
    value: "somedashboard.url/findings/{{ uid }}"
```

### Custom Message Templates

CAUTION: Nunjucks templates allow code to be injected! Use templates from trusted sources only!

The Notification Hook enables you to write your own message templates if the templates provided by default are not sufficient.
Templates for this hook are written using the [Nunjucks](https://mozilla.github.io/nunjucks/) templating engine.

To fill your template with data we provide the following objects.

| object   | Details                                                                                    |
| -------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| findings | An array of the findings matching your rules (See [Finding                                 | secureCodeBox](https://docs.securecodebox.io/docs/api/finding)                                                                          |
| scan     | An Object containing information about the scan that triggered the notification (See [Scan | secureCodeBox](https://docs.securecodebox.io/docs/api/crds/scan)                                                                        |
| args     | contains `process.env` (See: [process.env                                                  | nodejs](https://nodejs.org/api/process.html#process_process_env)) you can use this to access data defined in `env` of the `values.yaml` |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| customTemplateMap.exists | bool | `false` |  |
| customTemplateMap.name | string | `"config-map-name"` |  |
| env[0].name | string | `"SOME_ENV_KEY"` |  |
| env[0].valueFrom.secretKeyRef.key | string | `"some-key"` |  |
| env[0].valueFrom.secretKeyRef.name | string | `"some-secret"` |  |
| env[1].name | string | `"SMTP_CONFIG"` |  |
| env[1].valueFrom.secretKeyRef.key | string | `"smtp-config-key"` |  |
| env[1].valueFrom.secretKeyRef.name | string | `"some-secret"` |  |
| hook.affinity | object | `{}` | Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| hook.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| hook.image.repository | string | `"docker.io/securecodebox/hook-notification"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | Image tag |
| hook.labels | object | `{}` | Add Kubernetes Labels to the hook definition |
| hook.priority | int | `0` | Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks. |
| hook.tolerations | list | `[]` | Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| hook.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| notificationChannels[0].endPoint | string | `"SOME_ENV_KEY"` |  |
| notificationChannels[0].name | string | `"slack"` |  |
| notificationChannels[0].rules[0].matches.anyOf[0].category | string | `"Open Port"` |  |
| notificationChannels[0].template | string | `"slack-messageCard"` |  |
| notificationChannels[0].type | string | `"slack"` |  |

## Contributing

Contributions are welcome and extremely helpful 🙌
Please have a look at [Contributing](./CONTRIBUTING.md)

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://docs.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE


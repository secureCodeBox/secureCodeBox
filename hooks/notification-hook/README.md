<!--
SPDX-FileCopyrightText: 2020 iteratec GmbH

SPDX-License-Identifier: Apache-2.0
-->

---
title: "Notification Hook"
category: "hook"
type: "integration"
state: "roadmap"
usecase: "Publishes Scan Summary to MS Teams, Slack and others."
---

<!-- end -->

## Deployment

Installing the Notification hook will add a ReadOnly Hook to your namespace.

```bash
helm upgrade --install nwh ./hooks/notification-hook/ --values /path/to/your/values"
```
The `values.yaml` you need depends on the notification type you want to use.
Please take a look at the documentation for each type (e.g. for slack see [Configuration of a Slack Notification](#configuration-o-a-slack-notification))

## Available Notifier

* [Slack](#configuration-of-a-slack-notification)
* [Email](#configuration-of-an-email-notification)

## Configuration of a Notification

The general configuration of a notification looks something like this

```yaml
notificationChannels:
  - name: slack
    type: slack
    template: slack-messageCard
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
it can be a *string* of you choice.

The `type` specifies the type of the notification (in this example slack).
Currently `slack` is the only available type but we are working on others (e.g. ms teams or email) as well.

The `template` field defines the name of a Nunjuck template to send to your notification channel.
These templates are usually tied to their notification channel (slack templates will not work for teams).
The template `slack-messageCard` is provided by default.
Notice that for the name of the template we chose to omit the file type.
The template `slack-messageCard` will point to `slack-messageCard.njk` in the filesystem of the hook.

The `endPoint` specifies where the notification has to go to.
To protect the actual endPoint (e.g. a webhook url) this should point to a env name defined under `env`
For slack this would be your webhook URL to slack.

To define conditions when a notification should be created you can use `rules`.
If no rules are specified this hook will assume that you always want to be notified.

Under `env` you have to define additional informations needed for your templates such as the actual endpoint.
`env` will be mapped to the `env` implementation of Kubernetes.
This means that you can define key-value pairs as well as providing envs via secrets (See [Define Environment Variables for a Container | Kubernetes](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)).

### Rule Configuration

The rules can be defined in the values of the Chart.
The syntax and semantic for these rules are quite similar to CascadingRules (See: [secureCodeBox | CascadingRules](/docs/api/crds/cascading-rule))
To define Rules you will have to provide the `rules` field with one or more `matches` elements.
Each `machtes` defines one Rule.
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

#### matches

Within the `matches` you will have to provide `anyOf`
`anyOf` contains one or more conditions to be met by the finding to match the rule.
Notice that only one of this elements needs to match the finding for the rule to match.

### Configuration of a Slack Notification

To configure a slack notification set the `type` to `slack` and the `endPoint` to point to your env containing your Webhook URL to slack.
You can use one of the following default templates:
* slack-messageCard

### Configuration Of An Email Notification

To configure an email notification set the `type` to `email` and the `endPoint` to point to your env containing your target email address.
You can use one of the following default templates:
* email

Additional to this configuration you will have to provide a special smtp configuration URL.
This config reflects the transporter configuration of nodemailer (See [nodemailer | SMTP Transport](https://nodemailer.com/smtp/)).
This configuration needs to be specified under `env` in the values yaml.
The identifier for this config has to be `SMTP_CONFIG`.
A basic configuration could look like this:

```
...
env:
  - name: SMTP_CONFIG
    value: "smtp://user@domain.tld:pass@smtp.domain.tld/"
```

To provide a custom `from` field for your email you can specify `EMAIL_FROM` under env.
For example:

```
env:
  - name: SMTP_CONFIG
    value: "smtp://user@domain.tld:pass@smtp.domain.tld/"
  - name: EMAIL_FROM
    value: secureCodeBox
```

## Custom Message Templates

CAUTION: Nunjucks templates allow code to be injected! Use templates from trusted sources only!

The Notification Hook enables you to write your own message templates if the templates provided by default are not sufficient.
Templates for this hook are written using the [Nunjucks](https://mozilla.github.io/nunjucks/) templating engine.

To fill your template with data we provide the following objects.

| object   | Details                                                                                                                     |
|----------|-----------------------------------------------------------------------------------------------------------------------------|
| findings | An array of the findings matching your rules (See [Finding | secureCodeBox](https://docs.securecodebox.io/docs/api/finding) |
| scan     | An Object containing information about the scan that triggered the notification (See [Scan | secureCodeBox](https://docs.securecodebox.io/docs/api/crds/scan) |
| args     | contains `process.env` (See: [process.env | nodejs](https://nodejs.org/api/process.html#process_process_env)) you can use this to access data defined in `env` of the `values.yaml` |

## Chart Configuration

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
| hookJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| image.pullPolicy | string | `"Always"` |  |
| image.repository | string | `"docker.io/securecodebox/notification-hook"` | Hook image repository |
| image.tag | string | defaults to the charts version | Image tag |
| notificationChannels[0].endPoint | string | `"SOME_ENV_KEY"` |  |
| notificationChannels[0].name | string | `"slack"` |  |
| notificationChannels[0].rules[0].matches.anyOf[0].category | string | `"Open Port"` |  |
| notificationChannels[0].template | string | `"slack-messageCard"` |  |
| notificationChannels[0].type | string | `"slack"` |  |


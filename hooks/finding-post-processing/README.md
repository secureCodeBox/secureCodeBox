---
title: "Finding Post Processing"
category: "hook"
type: "dataProcessing"
state: "released"
usecase: "Updates fields for findings meeting specified conditions."
---

<!-- end -->

## Deployment

Installing the _Finding Post Processing_ hook will add a ReadAndWrite Hook to your namespace,
which can be used to add or update fields from your findings meeting specified conditions.

```bash
helm upgrade --install fpp secureCodeBox/finding-post-processing
```

## Rule Configuration

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
    override:
      severity: "high"
      description: "Telnet is bad"
```

This Rule will match all Findings with an open port on 23 and override the severity for this finding with `high` as well as providing a new description `Telnet is bad`.

### matches

Within the `matches` you will have to provide `anyOf` and `override`.
In the `anyOff` contains one or more conditions to be met by the finding to match the rule.
Notice that only one of these elements needs to match the finding for the rule to match.

### override

The `override` field specifies the desired fields and values that need to be updated or added if the rule is matching.

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| hook.image.repository | string | `"docker.io/securecodebox/finding-post-processing"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | The image Tag defaults to the charts version if not defined. |
| hook.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| rules | list | `[]` |  |

---
title: "Gitleaks"
path: "scanners/gitleaks"
category: "scanner"
type: "Repository"
state: "in progress"
appVersion: "6.1.2"
usecase: "Find potential secrets in repositories"
---

![gitleaks logo](https://raw.githubusercontent.com/zricethezav/gifs/master/gitleakslogo.png)

Gitleaks is a free and open source tool for finding secrets in git repositories.
These secrets could be passwords, API keys, tokens, private keys or suspicious file names or
file extensions like *id_rsa*, *.pem*, *htpasswd*. Furthermore gitleaks can scan your whole repository's history
with all commits up to the initial one.

To learn more about gitleaks visit <https://github.com/zricethezav/gitleaks>

## Deployment
The gitleaks scanner can be deployed with helm:
```bash
helm upgrade --install gitleaks ./scanners/gitleaks/
```

## Scanner configuration
For a complete overview of the configuration options checkout the
[Gitleaks documentation](https://github.com/zricethezav/gitleaks/wiki/Options).

The only mandatory parameters are:
- `-r`: The link to the repository you want to scan.
- `--access-token`: Only for non-public repositories.
- `--username` and `--password`: Only for non-public repositories.
- `--config`: The ruleset you want to use.

**Do not** override the option `--report-format` or `--report`. It is already configured for automatic findings parsing.

#### Ruleset
At this point we provide three rulesets which you can pass to the `--config` oprtion:

- `/home/config_all.toml`: Includes every rule.
- `/home/config_filenames_only.toml`: Gitleaks scans only file names and extensions.
- `/home/config_no_generics.toml`: No generic rules like searching for the word *password*. With this option you won't
find something like **password = Ej2ifDk2jfeo2** but it will reduce resulting false positives.

#### Other useful options are:
- `--commit-since`: Scan commits more recent than a specific date. Ex: '2006-01-02' or '2006-01-02T15:04:05-0700' format.
- `--commit-until`: Scan commits older than a specific date. Ex: '2006-01-02' or '2006-01-02T15:04:05-0700' format.
- `--repo-config`: Load config from target repo. Config file must be ".gitleaks.toml" or "gitleaks.toml".

#### Finding format
It is not an easy task to classify the severity of the scans because we can't tell for sure if the finding is e.g. a real
or a testing password. Another issue is that the rate of false positives for generic rules can be very high. Therefore,
we tried to classify the severity of the finding by looking at the accuracy of the rule which detected it. Rules for AWS
secrets or Artifactory tokens are very precise, so they get a high severity. Generic rules on the other hand get a low
severity because the often produce false positives.

**Please keep in mind that findings with a low severity can be actually
very critical.**

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.repository | string | `"secureCodeBox/scanner-gitleaks"` | Container Image to run the scan |
| image.tag | string | `nil` | defaults to the charts version |
| parserImage.repository | string | `"secureCodeBox/parser-gitleaks"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[{"mountPath":"/home/","name":"gitleaks-config"}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[{"configMap":{"name":"gitleaks-config"},"name":"gitleaks-config"}]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | Defines how long the scanner job after finishing will be available (see: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/) |


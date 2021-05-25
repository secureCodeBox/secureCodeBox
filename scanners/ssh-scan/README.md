---
title: "SSH"
category: "scanner"
type: "SSH"
state: "released"
appVersion: "0.0.43"
usecase: "SSH Configuration and Policy Scanner"
---

SSH_scan is an easy-to-use prototype SSH configuration and policy scanner, inspired by Mozilla OpenSSH Security Guide, which provides a reasonable baseline policy recommendation for SSH configuration parameters such as Ciphers, MACs, and KexAlgos and much more.

To learn more about the ssh_scan scanner itself visit [ssh_scan GitHub].

<!-- end -->

## Deployment

The SSH_scan ScanType can be deployed via helm.

```bash
helm upgrade --install ssh-scan secureCodeBox/ssh-scan
```

## Scanner Configuration

The following security scan configuration example are based on the [ssh_scan Documentation], please take a look at the original documentation for more configuration examples.

```bash
ssh_scan v0.0.21 (https://github.com/mozilla/ssh_scan)

Usage: ssh_scan [options]
    -t, --target [IP/Range/Hostname] IP/Ranges/Hostname to scan
    -f, --file [FilePath]            File Path of the file containing IP/Range/Hostnames to scan
    -T, --timeout [seconds]          Timeout per connect after which ssh_scan gives up on the host
    -L, --logger [Log File Path]     Enable logger
    -O, --from_json [FilePath]       File to read JSON output from
    -o, --output [FilePath]          File to write JSON output to
    -p, --port [PORT]                Port (Default: 22)
    -P, --policy [FILE]              Custom policy file (Default: Mozilla Modern)
        --threads [NUMBER]           Number of worker threads (Default: 5)
        --fingerprint-db [FILE]      File location of fingerprint database (Default: ./fingerprints.db)
        --suppress-update-status     Do not check for updates
    -u, --unit-test [FILE]           Throw appropriate exit codes based on compliance status
    -V [STD_LOGGING_LEVEL],
        --verbosity
    -v, --version                    Display just version info
    -h, --help                       Show this message

Examples:

  ssh_scan -t 192.168.1.1
  ssh_scan -t server.example.com
  ssh_scan -t ::1
  ssh_scan -t ::1 -T 5
  ssh_scan -f hosts.txt
  ssh_scan -o output.json
  ssh_scan -O output.json -o rescan_output.json
  ssh_scan -t 192.168.1.1 -p 22222
  ssh_scan -t 192.168.1.1 -p 22222 -L output.log -V INFO
  ssh_scan -t 192.168.1.1 -P custom_policy.yml
  ssh_scan -t 192.168.1.1 --unit-test -P custom_policy.yml
```

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `true` | Enables or disables the installation of the default cascading rules for this scanner |
| image.repository | string | `"mozilla/ssh_scan"` | Container Image to run the scan |
| image.tag | string | `"latest@sha256:ebd76f798159844c0baca6b78cc324ba1966b11eb4f45118397a59d01f764c97"` | defaults to the charts appVersion |
| parseJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| parserImage.repository | string | `"docker.io/securecodebox/parser-ssh-scan"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

[ssh_scan GitHub]: https://github.com/mozilla/ssh_scan
[ssh_scan Documentation]: https://github.com/mozilla/ssh_scan#example-command-line-usage

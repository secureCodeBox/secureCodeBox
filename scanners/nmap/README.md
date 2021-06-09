---
title: "Nmap"
category: "scanner"
type: "Network"
state: "released"
appVersion: "7.80"
usecase: "Network discovery and security auditing"
---

![Nmap logo](https://nmap.org/images/sitelogo.png)

Nmap ("Network Mapper") is a free and open source (license) utility for network discovery and security auditing. Many systems and network administrators also find it useful for tasks such as network inventory, managing service upgrade schedules, and monitoring host or service uptime.

To learn more about the Nmap scanner itself visit [nmap.org].

<!-- end -->

## Deployment

The Nmap ScanType can be deployed via helm:

```bash
helm upgrade --install nmap secureCodeBox/nmap
```

## Scanner Configuration

The Nmap scan targets are specified as the last parameter. The target should be a hostname, an IP address or an IP range. See [Nmap Docs](https://nmap.org/book/man-target-specification.html) for details.

Additional Nmap scan features can be configured via the parameter attribute. For a detailed explanation to which parameters are available refer to the [Nmap Reference Guide](https://nmap.org/book/man.html). All parameters are supported, but be careful with parameters that require root level rights, as these require additional configuration on the ScanType to be supported.

Some useful example parameters listed below:

- `-p` xx: Scan ports of the target. Replace xx with a single port number or a range of ports.
- `-PS`, `-PA`, `-PU` xx: Replace xx with the ports to scan. TCP SYN/ACK or
  UDP discovery.
- `-sV`: Determine service and version info.
- `-O`: Determine OS info. **Note:** This requires that Nmap is run as root, or that the user has the system capabilities to be extended to allow Nmap to send raw sockets. See more information on [how to deploy the secureCodeBox nmap container to allow this](https://github.com/secureCodeBox/scanner-infrastructure-nmap/pull/20) and the [nmap docs about privileged scans](https://secwiki.org/w/Running_nmap_as_an_unprivileged_user)
- `-A`: Determine service/version and OS info.
- `-script` xx: Replace xx with the script name. Start the scan with the given script.
- `--script` xx: Replace xx with a coma-separated list of scripts. Start the scan with the given scripts.

## Operating System Scans

:::caution
Warning! This is currently not tested and might require additional testing to work 😕
:::

If you want to use Nmap to identify operating systems of hosts you'll need to weaken the securityContext config, as Nmap requires the capability to send raw sockets to identify operating systems. See [Nmap Docs](https://secwiki.org/w/Running_nmap_as_an_unprivileged_user)

You can deploy the ScanType with the config like this:

```bash
cat <<EOF | helm install nmap-privileged ./scanners/nmap --values -
scanner:
  env:
    - name: "NMAP_PRIVILEGED"
      value: "true"
  securityContext:
    capabilities:
      drop:
        - all
      add:
        - CAP_NET_RAW
        - CAP_NET_ADMIN
        - CAP_NET_BIND_SERVICE
EOF
```

Then, you can start scans with operating system identification enabled:

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "nmap-os-scan"
spec:
  scanType: "nmap-privileged"
  parameters:
    - --privileged
    - "-O"
    - www.iteratec.de
```

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `true` | Enables or disables the installation of the default cascading rules for this scanner |
| parser.image.repository | string | `"docker.io/securecodebox/parser-nmap"` | Parser image repository |
| parser.image.tag | string | defaults to the charts appVersion | Parser image tag |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.repository | string | `"docker.io/securecodebox/scanner-nmap"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts version |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scanner.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scanner.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scanner.securityContext.readOnlyRootFilesystem | bool | `true` | Prevents write access to the containers file system |
| scanner.securityContext.runAsNonRoot | bool | `true` | Enforces that the scanner image is run as a non root user |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

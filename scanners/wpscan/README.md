---
title: 'WPScan'
path: 'scanners/wpscan'
category: 'scanner'
type: "CMS"
state: "released"
appVersion: "3.8.5"
usecase: 'Wordpress Vulnerability Scanner'
---

![WPScan Logo](https://raw.githubusercontent.com/wpscanteam/wpscan/gh-pages/images/wpscan_logo.png)

WPScan is a free, for non-commercial use, black box WordPress vulnerability scanner written for security professionals and blog maintainers to test the security of their sites.

> NOTE: You need to provide WPSan with an API Token so that it can look up vulnerabilities infos with [https://wpvulndb.com](https://wpvulndb.com). Without the token WPScan will only identify WordPress Core / Plugin / Theme versions but not if they are actually vulnerable. You can get a free API Token at by registering for an account at [https://wpvulndb.com](https://wpvulndb.com). Using the secureCodeBox WPScans you can specify the token via the `WPVULNDB_API_TOKEN` target attribute, see the example below.

To learn more about the WPScan scanner itself visit [wpscan.org] or [wpscan.io].

<!-- end -->

## Deployment

The WPScan scanType can be deployed via helm:

```bash
helm upgrade --install wpscan secureCodeBox/wpscan
```

## Scanner Configuration

The following security scan configuration example are based on the [WPScan Documentation], please take a look at the original documentation for more configuration examples.

* Scan all plugins with known vulnerabilities: `wpscan --url example.com -e vp --plugins-detection mixed --api-token WPVULNDB_API_TOKEN`
* Scan all plugins in our database (could take a very long time): `wpscan --url example.com -e ap --plugins-detection mixed --api-token WPVULNDB_API_TOKEN`
* Password brute force attack: `wpscan --url example.com -e u --passwords /path/to/password_file.txt`
* WPScan keeps a local database of metadata that is used to output useful information, such as the latest version of a plugin. The local database can be updated with the following command: `wpscan --update`
* When enumerating the WordPress version, installed plugins or installed themes, you can use three different "modes", which are:
  * passive
  * aggressive
  * mixed
  If you want the most results use the "mixed" mode. However, if you are worried that the server may not be able to handle many requests, use the "passive" mode. The default mode is "mixed", except plugin enumeration, which is "passive". You will need to manually override the plugin detection mode, if you want to use anything other than the default, with the `--plugins-detection` option.
* WPScan can enumerate various things from a remote WordPress application, such as plugins, themes, usernames, backed up files wp-config.php files, Timthumb files, database exports and more. To use WPScan's enumeration capabilities supply the `-e `option.

```bash
Available Choices:
  vp  |  Vulnerable plugins
  ap  |  All plugins
  p   |  Plugins
  vt  |  Vulnerable themes
  at  |  All themes
  t   |  Themes
  tt  |  Timthumbs
  cb  |  Config backups
  dbe |  Db exports
  u   |  User IDs range. e.g: u1-5
         Range separator to use: '-'
         Value if no argument supplied: 1-10
  m   |  Media IDs range. e.g m1-15
         Note: Permalink setting must be set to "Plain" for those to be detected
         Range separator to use: '-'
         Value if no argument supplied: 1-100

Separator to use between the values: ','
Default: All Plugins, Config Backups
Value if no argument supplied: vp,vt,tt,cb,dbe,u,m
Incompatible choices (only one of each group/s can be used):
  - vp, ap, p
  - vt, at, t
```

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| parser.image.repository | string | `"docker.io/securecodebox/parser-wpscan"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.repository | string | `"wpscanteam/wpscan"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts appVersion |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

[wpscan.io]: https://wpscan.io/
[wpscan.org]: https://wpscan.org/
[WPScan Documentation]: https://github.com/wpscanteam/wpscan/wiki/WPScan-User-Documentation

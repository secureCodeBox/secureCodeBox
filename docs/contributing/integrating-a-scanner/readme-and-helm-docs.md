---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: README.md And .helm-docs.gotmpl
sidebar_position: 9
---

You may have noticed that all our scanners provide a `README.md` as well as a `.helm-docs.gotmpl`.
The reason for this is that we want to provide the documentation of our Helm values directly in our `README.md`.
To avoid the need to do this task manually we use a tool that creates a table with all our values directly from our `values.yaml`.
Therefore there is no need to make any changes on the `README.md` itself.
Every change has to be made in the `.helm-docs.gotmpl` file.

The `.helm-docs.gotmpl` should contain basic information about your scanner like its purpose, how it is deployed, how it is configured as well as its Chart configurations generated out of the `values.yaml`.
For example the `.helm-docs.gotmpl` for _WPScan_ looks like this:

````markdown {73}
---
title: 'WPScan'
category: 'scanner'
type: "CMS"
state: "released"
appVersion: "{{ template "chart.appVersion" . }}"
usecase: "Wordpress Vulnerability Scanner"
---

![WPScan Logo](https://raw.githubusercontent.com/wpscanteam/wpscan/gh-pages/images/wpscan_logo.png)

{{- end }}

{{- define "extra.dockerDeploymentSection" -}}

## Supported Tags

- `latest` (represents the latest stable release build)
- tagged releases, e.g. `3.0.0`, `2.9.0`, `2.8.0`, `2.7.0`
  {{- end }}

{{- define "extra.chartAboutSection" -}}

## What is WPScan?

WPScan is a free, for non-commercial use, black box WordPress vulnerability scanner written for security professionals and blog maintainers to test the security of their sites.

> NOTE: You need to provide WPSan with an API Token so that it can look up vulnerabilities infos with [https://wpvulndb.com](https://wpvulndb.com). Without the token WPScan will only identify WordPress Core / Plugin / Theme versions but not if they are actually vulnerable. You can get a free API Token at by registering for an account at [https://wpvulndb.com](https://wpvulndb.com). Using the secureCodeBox WPScans you can specify the token via the `WPVULNDB_API_TOKEN` target attribute, see the example below.

To learn more about the WPScan scanner itself visit [wpscan.org] or [wpscan.io].
{{- end }}

{{- define "extra.scannerConfigurationSection" -}}

## Scanner Configuration

The following security scan configuration example are based on the [WPScan Documentation], please take a look at the original documentation for more configuration examples.

- Scan all plugins with known vulnerabilities: `wpscan --url example.com -e vp --plugins-detection mixed --api-token WPVULNDB_API_TOKEN`
- Scan all plugins in our database (could take a very long time): `wpscan --url example.com -e ap --plugins-detection mixed --api-token WPVULNDB_API_TOKEN`
- Password brute force attack: `wpscan --url example.com -e u --passwords /path/to/password_file.txt`
- WPScan keeps a local database of metadata that is used to output useful information, such as the latest version of a plugin. The local database can be updated with the following command: `wpscan --update`
- When enumerating the WordPress version, installed plugins or installed themes, you can use three different "modes", which are:
  - passive
  - aggressive
  - mixed
    If you want the most results use the "mixed" mode. However, if you are worried that the server may not be able to handle many requests, use the "passive" mode. The default mode is "mixed", except plugin enumeration, which is "passive". You will need to manually override the plugin detection mode, if you want to use anything other than the default, with the `--plugins-detection` option.
- WPScan can enumerate various things from a remote WordPress application, such as plugins, themes, usernames, backed up files wp-config.php files, Timthumb files, database exports and more. To use WPScan's enumeration capabilities supply the `-e `option.

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

{{- end }}

{{- define "extra.chartConfigurationSection" -}}
{{- end }}

{{- define "extra.scannerLinksSection" -}}
[wpscan.io]: https://wpscan.io/
[wpscan.org]: https://wpscan.org/
[WPScan Documentation]: https://github.com/wpscanteam/wpscan/wiki/WPScan-User-Documentation
{{- end }}
````

If you want to generate the `README.md` out of your `.helm-docs.gotmpl` locally, you need to install `helm-docs` (see: [https://github.com/norwoodj/helm-docs/](https://github.com/norwoodj/helm-docs/)) and run `make docs`.

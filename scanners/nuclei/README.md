---
title: "Nuclei"
category: "scanner"
type: "Website"
state: "released"
appVersion: "v3.0.4"
usecase: "Nuclei is a fast, template based vulnerability scanner."
---

<!--
SPDX-FileCopyrightText: the secureCodeBox authors

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
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Lab Project" src="https://img.shields.io/badge/OWASP-Lab%20Project-yellow"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is Nuclei
Nuclei is used to send requests across targets based on a template leading to zero false positives and providing fast scanning on large number of hosts. Nuclei offers scanning for a variety of protocols including TCP, DNS, HTTP, File, etc. With powerful and flexible templating, all kinds of security checks can be modelled with Nuclei.

To learn more about the Nuclei scanner itself visit [Nuclei GitHub] or [Nuclei Website].

## Deployment
The nuclei chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install nuclei secureCodeBox/nuclei
```

## Scanner Configuration

The following security scan configuration example are based on the [Nuclei Documentation], please take a look at the original documentation for more configuration examples.

```bash
nuclei -h
Nuclei is a fast, template based vulnerability scanner focusing
on extensive configurability, massive extensibility and ease of use.

Usage:
  nuclei [flags]

Flags:
TARGET:
   -u, -target string[]  target URLs/hosts to scan
   -l, -list string      path to file containing a list of target URLs/hosts to scan (one per line)

TEMPLATES:
   -tl                      list all available templates
   -t, -templates string[]  template or template directory paths to include in the scan
   -w, -workflows string[]  list of workflows to run
   -nt, -new-templates      run newly added templates only
   -validate                validate the passed templates to nuclei

FILTERING:
   -tags string[]                         execute a subset of templates that contain the provided tags
   -include-tags string[]                 tags from the default deny list that permit executing more intrusive templates
   -etags, -exclude-tags string[]         exclude templates with the provided tags
   -include-templates string[]            templates to be executed even if they are excluded either by default or configuration
   -exclude-templates, -exclude string[]  template or template directory paths to exclude
   -severity, -impact string[]            execute templates that match the provided severities only
   -author string[]                       execute templates that are (co-)created by the specified authors

OUTPUT:
   -o, -output string            output file to write found issues/vulnerabilities
   -silent                       display findings only
   -v, -verbose                  show verbose output
   -vv                           display extra verbose information
   -nc, -no-color                disable output content coloring (ANSI escape codes)
   -json                         write output in JSONL(ines) format
   -irr, -include-rr             include request/response pairs in the JSONL output (for findings only)
   -nm, -no-meta                 don't display match metadata
   -rdb, -report-db string       local nuclei reporting database (always use this to persist report data)
   -me, -markdown-export string  directory to export results in markdown format
   -se, -sarif-export string     file to export results in SARIF format

CONFIGURATIONS:
   -config string              path to the nuclei configuration file
   -rc, -report-config string  nuclei reporting module configuration file
   -H, -header string[]        custom headers in header:value format
   -V, -var value              custom vars in var=value format
   -r, -resolvers string       file containing resolver list for nuclei
   -system-resolvers           use system DNS resolving as error fallback
   -passive                    enable passive HTTP response processing mode
   -env-vars                   Enable environment variables support

INTERACTSH:
   -no-interactsh                     do not use interactsh server for blind interaction polling
   -interactsh-url string             self-hosted Interactsh Server URL (default "https://interact.sh")
   -interactions-cache-size int       number of requests to keep in the interactions cache (default 5000)
   -interactions-eviction int         number of seconds to wait before evicting requests from cache (default 60)
   -interactions-poll-duration int    number of seconds to wait before each interaction poll request (default 5)
   -interactions-cooldown-period int  extra time for interaction polling before exiting (default 5)

RATE-LIMIT:
   -rl, -rate-limit int          maximum number of requests to send per second (default 150)
   -rlm, -rate-limit-minute int  maximum number of requests to send per minute
   -bs, -bulk-size int           maximum number of hosts to be analyzed in parallel per template (default 25)
   -c, -concurrency int          maximum number of templates to be executed in parallel (default 10)

OPTIMIZATIONS:
   -timeout int               time to wait in seconds before timeout (default 5)
   -retries int               number of times to retry a failed request (default 1)
   -project                   use a project folder to avoid sending same request multiple times
   -project-path string       set a specific project path (default "/var/folders/xq/zxykn5wd0tx796f0xhxf94th0000gp/T/")
   -spm, -stop-at-first-path  stop processing HTTP requests after the first match (may break template/workflow logic)

HEADLESS:
   -headless          enable templates that require headless browser support
   -page-timeout int  seconds to wait for each page in headless mode (default 20)
   -show-browser      show the browser on the screen when running templates with headless mode

DEBUG:
   -debug                     show all requests and responses
   -debug-req                 show all sent requests
   -debug-resp                show all received responses
   -proxy, -proxy-url string  URL of the HTTP proxy server
   -proxy-socks-url string    URL of the SOCKS proxy server
   -trace-log string          file to write sent requests trace log
   -version                   show nuclei version
   -tv, -templates-version    shows the version of the installed nuclei-templates

UPDATE:
   -update                        update nuclei to the latest released version
   -ut, -update-templates         update the community templates to latest released version
   -nut, -no-update-templates     Do not check for nuclei-templates updates
   -ud, -update-directory string  overwrite the default nuclei-templates directory (default "/Users/robert/nuclei-templates")

STATISTICS:
   -stats                    display statistics about the running scan
   -stats-json               write statistics data to an output file in JSONL(ines) format
   -si, -stats-interval int  number of seconds to wait between showing a statistics update (default 5)
   -metrics                  expose nuclei metrics on a port
   -metrics-port int         port to expose nuclei metrics on (default 9092)
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Install Nuclei without Template Cache CronJob / PersistentVolume

Nuclei uses dynamic templates as its scan rules, these determine which requests are performed and which responses are considered to be a finding.
These templates are usually dynamically downloaded by nuclei from GitHub before each scan. When you are running dozens of parallel nuclei scans you quickly run into situations where GitHub will rate limit you causing the scans to fail.
To avoid these errors we included a CronJob which periodically fetches the current templates and writes them into a kubernetes PersistentVolume (PV). This volume is then mounted (as a `ReadOnlyMany` mount) into every scan so that nuclei scans have the up-to-date templates without having to download them on every scan.

Unfortunately not every cluster supports the required `ReadOnlyMany` volume type.
In these cases you can disable the template cache mechanism by setting `nucleiTemplateCache.enabled=false`.
Note thought, that this will limit the number of scans you can run in parallel as the rate limit will likely cause some of the scans to fail.

```bash
helm install nuclei secureCodeBox/nuclei --set="nucleiTemplateCache.enabled=false"
```

<table>
    <thead>
        <th>Key</th>
        <th>Type</th>
        <th class="default-column">Default</th>
        <th>Description</th>
    </thead>
    <tbody>
        <tr>
            <td>cascadingRules.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Enables or disables the installation of the default cascading rules for this scanner</td>
        </tr>
        <tr>
            <td>imagePullSecrets</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)</td>
        </tr>
        <tr>
            <td>nucleiTemplateCache.accessMode</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `["ReadWriteOnce","ReadOnlyMany"]`
</pre></td>
            <td>Depending on your setup you can define the pvc access mode for one `ReadWriteOnce` or multiple node clusters `ReadWriteMany`</td>
        </tr>
        <tr>
            <td>nucleiTemplateCache.concurrencyPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"Replace"`
</pre></td>
            <td>Determines how kubernetes handles cases where multiple instances of the cronjob would work if they are running at the same time. See: https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/#concurrency-policy</td>
        </tr>
        <tr>
            <td>nucleiTemplateCache.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enables or disables the use of an persistent volume to cache the always downloaded nuclei-templates for all scans.</td>
        </tr>
        <tr>
            <td>nucleiTemplateCache.failedJobsHistoryLimit</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

    `10`
</pre></td>
            <td>Determines how many failed jobs are kept until kubernetes cleans them up. See: https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/#jobs-history-limits</td>
        </tr>
        <tr>
            <td>nucleiTemplateCache.schedule</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"0 */1 * * *"`
</pre></td>
            <td>The schedule indicates when and how often the nuclei template cache should be updated</td>
        </tr>
        <tr>
            <td>nucleiTemplateCache.successfulJobsHistoryLimit</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

    `3`
</pre></td>
            <td>Determines how many successful jobs are kept until kubernetes cleans them up. See: https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/#jobs-history-limits</td>
        </tr>
        <tr>
            <td>parser.affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)</td>
        </tr>
        <tr>
            <td>parser.env</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)</td>
        </tr>
        <tr>
            <td>parser.image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>parser.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/parser-nuclei"`
</pre></td>
            <td>Parser image repository</td>
        </tr>
        <tr>
            <td>parser.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    defaults to the charts version
</pre></td>
            <td>Parser image tag</td>
        </tr>
        <tr>
            <td>parser.resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

   
</pre></td>
            <td>Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/</td>
        </tr>
        <tr>
            <td>parser.scopeLimiterAliases</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional finding aliases to be used in the scopeLimiter.</td>
        </tr>
        <tr>
            <td>parser.tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)</td>
        </tr>
        <tr>
            <td>parser.ttlSecondsAfterFinished</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>seconds after which the Kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/</td>
        </tr>
        <tr>
            <td>scanner.activeDeadlineSeconds</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup)</td>
        </tr>
        <tr>
            <td>scanner.affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)</td>
        </tr>
        <tr>
            <td>scanner.backoffLimit</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

   
</pre></td>
            <td>There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy)</td>
        </tr>
        <tr>
            <td>scanner.env</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)</td>
        </tr>
        <tr>
            <td>scanner.extraContainers</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)</td>
        </tr>
        <tr>
            <td>scanner.extraVolumeMounts</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>scanner.extraVolumes</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>scanner.image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>scanner.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/projectdiscovery/nuclei"`
</pre></td>
            <td>Container Image to run the scan</td>
        </tr>
        <tr>
            <td>scanner.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>defaults to the charts appVersion</td>
        </tr>
        <tr>
            <td>scanner.nameAppend</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>append a string to the default scantype name.</td>
        </tr>
        <tr>
            <td>scanner.podSecurityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)</td>
        </tr>
        <tr>
            <td>scanner.resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)</td>
        </tr>
        <tr>
            <td>scanner.securityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":false,"runAsNonRoot":false}`
</pre></td>
            <td>Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)</td>
        </tr>
        <tr>
            <td>scanner.securityContext.allowPrivilegeEscalation</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensure that users privileges cannot be escalated</td>
        </tr>
        <tr>
            <td>scanner.securityContext.capabilities.drop[0]</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"all"`
</pre></td>
            <td>This drops all linux privileges from the container.</td>
        </tr>
        <tr>
            <td>scanner.securityContext.privileged</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensures that the scanner container is not run in privileged mode</td>
        </tr>
        <tr>
            <td>scanner.securityContext.readOnlyRootFilesystem</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Prevents write access to the containers file system</td>
        </tr>
        <tr>
            <td>scanner.securityContext.runAsNonRoot</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Enforces that the scanner image is run as a non root user</td>
        </tr>
        <tr>
            <td>scanner.suspend</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>if set to true the scan job will be suspended after creation. You can then resume the job using `kubectl resume <jobname>` or using a job scheduler like kueue</td>
        </tr>
        <tr>
            <td>scanner.tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)</td>
        </tr>
        <tr>
            <td>scanner.ttlSecondsAfterFinished</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>seconds after which the Kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/</td>
        </tr>
    </tbody>
</table>

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[Nuclei Website]: https://nuclei.projectdiscovery.io/
[Nuclei GitHub]: https://github.com/projectdiscovery/nuclei
[Nuclei Documentation]: https://nuclei.projectdiscovery.io/nuclei/get-started/

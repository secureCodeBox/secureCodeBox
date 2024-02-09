---
title: "DefectDojo"
category: "hook"
type: "persistenceProvider"
state: "released"
usecase: "Publishes all Scan Reports to OWASP DefectDojo."
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
  <a href="https://infosec.exchange/@secureCodeBox"><img alt="Mastodon Follower" src="https://img.shields.io/mastodon/follow/111902499714281911?domain=https%3A%2F%2Finfosec.exchange%2F"/></a>
</p>

## What is Persistence DefectDojo Hook about?

The _DefectDojo_ _hook_ imports the reports from scans automatically into [OWASP DefectDojo](https://www.defectdojo.org/). The _hook_ uses the import scan [API v2 from DefectDojo](https://defectdojo.readthedocs.io/en/latest/api-v2-docs.html) to import the scan results.

_Scan types_ which are both supported by the _secureCodeBox_ and _DefectDojo_ benefit from the full feature set of _DefectDojo_, like deduplication. These scan types are:

- Nmap
- Nikto
- ZAP (Baseline, API Scan and Full Scan)
- ZAP Advanced
- SSLyze
- Trivy
- Gitleaks
- Semgrep

After uploading the results to _DefectDojo_, it will use the findings parsed by _DefectDojo_ to overwrite the original secureCodeBox findings identified by the parser. This lets you access the finding metadata like the false positive and duplicate status from _DefectDojo_ in further ReadOnly hooks, e.g. send out Slack notification for non-duplicate & non-false positive findings only.

For scan types which are not supported by _DefectDojo_, the generic importer is used, which will result in a less sophisticated display of the results and fewer features inside _DefectDojo_. In the worst case, it can lead to some findings being lost - see the note below.

:::note
A big amount of findings may require higher resource limits. Changing them may be required to avoid OOM errors. The default values are:

```yaml
requests: {
   cpu: "200m",
   memory: "100Mi"
},
limits: {
  cpu: "400m",
   memory: "200Mi"
}
```

For example, to set the memory limit to 512Mi, we run the following command:

```bash
helm upgrade --namespace NAMESPACE --install persistence-defectdojo secureCodeBox/persistence-defectdojo --set="hook.resources.limits.memory=512Mi"
```
:::

:::caution
Be careful when using the _DefectDojo_ Hook in combination with other ReadAndWrite hooks. By default, the _secureCodeBox_ makes no guarantees about the execution order of multiple ReadAndWrite hooks, they can be executed in any order. This can lead to "lost update" problems as the _DefectDojo_ hook will overwrite all findings, which disregards the results of previously run ReadAndWrite hooks. ReadOnly hooks work fine with the _DefectDojo_ hook as they are always executed after ReadAndWrite Hooks. If you want to control the order of execution of the different hooks, take a look at the [hook priority documentation](https://www.securecodebox.io/docs/how-tos/hooks#hook-order) (supported with _secureCodeBox_ 3.4.0 and later).
:::

:::caution
The _DefectDojo_ hook will send all scan results to _DefectDojo_, including those for which _DefectDojo_ does not have native support. In this case, _DefectDojo_ may incorrectly deduplicate findings, which can in some cases [lead to incomplete imports and even data loss](https://github.com/DefectDojo/django-DefectDojo/issues/5312). You can set the hook to read-only mode, which will prevent it from writing the results back to _secureCodeBox_ (`--set defectdojo.syncFindingsBack=false` during installation of the hook) if you want to rule out any data loss inside _secureCodeBox_, but this will not prevent the incorrect deduplication from affecting the data you see inside _DefectDojo_ (for this, you will need to [contribute a parser to DefectDojo](https://defectdojo.github.io/django-DefectDojo/contributing/how-to-write-a-parser/)). You can also selectively disable the _DefectDojo_ hook for certain scans using the [hook selector feature](https://www.securecodebox.io/docs/how-tos/hooks#hook-selector) (supported with _secureCodeBox_ 3.4.0 and later).
:::

### Running Persistence DefectDojo Hook Locally from Source

For development purposes, it can be useful to run this hook locally. You can do so by following these steps:

1. Make sure you have access to a running [DefectDojo](https://github.com/DefectDojo/django-DefectDojo) instance.
2. [Run a Scan](https://www.securecodebox.io/docs/getting-started/first-scans) of your choice.
3. Supply Download Links for the Scan Results (Raw Result and Findings.json). You can access them from the included [Minio Instance](https://www.securecodebox.io/docs/getting-started/installation/#accessing-the-included-minio-instance) and upload them to a GitHub Gist.
4. Set the following environment variables:
   - `DEFECTDOJO_URL` e.g http://192.168.0.1:8080
   - `DEFECTDOJO_USERNAME` e.g admin
   - `DEFECTDOJO_APIKEY` Can be fetched from the _DefectDojo_ API information page.
   - `DEFECTDOJO_IS_DEV=true` to enable dev mode, which loads a k8s config from `~/.kube/config`.
   - `DEFECTDOJO_LOW_PRIVILEGED_MODE` to enable [low privilege mode](https://www.securecodebox.io/docs/hooks/defectdojo/#low-privileged-mode)
   - `DEFECTDOJO_REFETCH_WAIT_SECONDS` :Seconds to wait until re-fetching findings from DefectDojo
   - `SCAN_NAME` e.g "nmap-scanme.nmap.org", must be set exactly to the name of the scan used in step 2.
5. Build the jar with gradle and run it with the following CLI arguments: \{Raw Result Download URL\} \{Findings Download URL\} \{Raw Result Upload URL\} \{Findings Upload URL\}. See the code snippet below. You have to adjust the filename of the jar for other versions than the '1.0.0-SNAPSHOT'. Also, you will need to change the download URLs for the Raw Result and Findings to the ones from Step 3.

```bash
./gradlew build
java -jar build/libs/defectdojo-persistenceprovider-0.1.0-SNAPSHOT.jar https://gist.githubusercontent.com/.../scanme-nmap-org.xml https://gist.githubusercontent.com/.../nmap-findings.json https://httpbin.org/put https://httpbin.org/put
```

## Deployment

The persistence-defectdojo chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install persistence-defectdojo secureCodeBox/persistence-defectdojo
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations

Installing the _DefectDojo_ persistenceProvider hook will add a _ReadAndWrite Hook_ to your namespace.

```bash
kubectl create secret generic defectdojo-credentials --from-literal="username=admin" --from-literal="apikey=08b7..."

helm upgrade --install dd secureCodeBox/persistence-defectdojo \
    --set="defectdojo.url=https://defectdojo-django.default.svc"
```

The hook will automatically import the scan results into an engagement in _DefectDojo_. If the engagement doesn't exist the hook will create the engagement (CI/CD engagement) and all objects required for it (product & product type). The hook will then pull the imported information from _DefectDojo_ and use them to replace the findings inside _secureCodeBox_.

In case you use a _DefectDojo_ instance with a self-signed root CA, upgrade the hook with:

```bash
helm upgrade --install dd secureCodeBox/persistence-defectdojo \
    --set="defectdojo.url=https://defectdojo-django.default.svc" \
    --set-json 'hook.extraVolumes=[{"name": "ca-dojo", "configMap": {"name": "ca-dojo"}}]' \
    --set-json 'hook.extraVolumeMounts=[{"name": "ca-dojo", "mountPath": "/etc/ssl/certs/java/cacerts", "subPath": "cacerts", "readOnly": false}]'
```
After, you can update `/etc/ssl/certs/java/cacerts` with your certificate.

You don't need any configuration for that to work, the hook will infer engagement & product names from the scan name. If you want more control over the names or add additional meta information like the version of the tested software you can add these via annotation to the scan. See examples below.

| Scan Annotation                                                    | Description                                 | Default if not set                                                   | Notes                                                                                  |
|--------------------------------------------------------------------|---------------------------------------------|----------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| `defectdojo.securecodebox.io/product-type-name`                    | Name of the Product Type                    | Product Type with ID 1 (typically "Research and Development")        | Product Type will be automatically created if no Product Type under that name exists   |
| `defectdojo.securecodebox.io/product-name`                         | Name of the Product                         | ScheduledScan Name if Scheduled, Scan Name if it's a standalone Scan | Product will be automatically created if no Product under that name exists             |
| `defectdojo.securecodebox.io/product-description`                  | Description of the Product                  | Empty String                                                         | Only used when creating the Product not used for updating                              |
| `defectdojo.securecodebox.io/product-tags`                         | Product Tags                                | Nothing                                                              | Only used when creating the Product not used for updating                              |
| `defectdojo.securecodebox.io/engagement-name`                      | Name of the Engagement                      | Scan Name                                                            | Will be automatically created if no *engagement* with that name **and** version exists |
| `defectdojo.securecodebox.io/engagement-version`                   | Engagement Version                          | Nothing                                                              |                                                                                        |
| `defectdojo.securecodebox.io/engagement-deduplicate-on-engagement` | Deduplicate On Engagement                   | false                                                                | Only used when creating the Engagement not used for updating                           |
| `defectdojo.securecodebox.io/engagement-tags`                      | Engagement Tags                             | Nothing                                                              | Only used when creating the Engagement not used for updating                           |
| `defectdojo.securecodebox.io/test-title`                           | Test Title                                  | Scan Name                                                            |                                                                                        |
| `defectdojo.securecodebox.io/minimum_severity`                     | Minimum severity for findings created in DD | Nothing                                                              | Used to only create finding in DD, which are of a certain severity                     |

### Read-only Mode

By default, the _DefectDojo_ hook will pull the imported results from _DefectDojo_ and use them to replace the results inside _secureCodeBox_. This allows you to benefit from _DefectDojo_'s deduplication logic and only trigger follow-up scans or notifications for new findings. If you want to disable this feature, you can install the hook in read-only mode using `--set defectdojo.syncFindingsBack=false` while installing the hook using Helm.

### Notes on `syncFindingBack` Mode & Duplicate Findings

Attributes like if a finding has been marked as accepted or has been marked as a false positive in _DefectDojo_ are only attached to the original finding. The duplicated findings will always have the `falsePositive`, `riskAccepted` and `outOfScope` attributes set to false as they have just been imported. To enable users to access this meta information on the original the `syncFindingBack` mode automatically embeds the orignal finding in the attributes of synced back duplicate findings. The following example shows a finding produced by the `syncFindingBack` mode, in which the original finding has been marked as accepted.

```yaml
# example synced back duplicate finding
{
  "id": "69f891e7-3876-4506-84f2-7e4e2b33923e",
  "name": "Open Port: 80/TCP",
  "location": "tcp://scanme.nmap.org:80",
  "description": "### Host\n\n**IP Address:** 45.33.32.156\n**FQDN:** scanme.nmap.org\n\n\n**Port/Protocol:** 80/tcp\n\n\n\n\n",
  "category": "DefectDojo Imported Finding",
  "severity": "INFORMATIONAL",
  "attributes": {
    "defectdojo.org/finding-id": 42,
    "defectdojo.org/finding-url": "https://defectdojo.example.com/finding/42",
    "defectdojo.org/test-id": 7,
    "falsePositive": false,
    "defectdojo.org/test-url": "https://defectdojo.example.com/test/7",
    "defectdojo.org/original-finding-id": 1607206,
    # highlight-start
    "duplicate": true,
    "riskAccepted": false,
    "outOfScope": false,
    # highlight-end
    "defectdojo.org/original-finding": {
      "id": "7c2d64d0-3f41-42b6-84a4-0beeab746d1b",
      "name": "Open Port: 80/TCP",
      "location": "tcp://scanme.nmap.org:80",
      "description": "### Host\n\n**IP Address:** 45.33.32.156\n**FQDN:** scanme.nmap.org\n\n\n**Port/Protocol:** 80/tcp\n\n\n\n\n",
      "category": "DefectDojo Imported Finding",
      "severity": "INFORMATIONAL",
      "attributes": {
        "defectdojo.org/finding-id": 38,
        "defectdojo.org/finding-url": "https://defectdojo.example.com/finding/38",
        "defectdojo.org/test-id": 3,
        "falsePositive": false,
        "defectdojo.org/test-url": "https://defectdojo.example.com/test/3",
        "defectdojo.org/original-finding-id": null,
        # highlight-start
        "duplicate": false,
        "riskAccepted": true,
        "outOfScope": false,
        # highlight-end
        "defectdojo.org/original-finding": null
      },
      "osi_layer": null,
      "parsed_at": "2022-04-05T12:29:24.760758Z",
      "identified_at": null
    }
  },
  "osi_layer": null,
  "parsed_at": "2022-04-05T13:22:46.230736Z",
  "identified_at": null
}
```

### Low Privileged Mode

By default, the _DefectDojo_ Hook requires an API Token with platform wide "Staff" access rights.

_DefectDojo_ >2.0.0 refined their user access rights, allowing you to restrict the users access rights to only view specific product types in _DefectDojo_. The _secureCodeBox_ _DefectDojo_ Hook can be configured to run with such a token of a "low privileged" users by setting the `defectdojo.lowPrivilegedMode=true`.

#### Limitations of the Low Privileged Mode

- Instead of the username, the userId **must** be configured as the low privileged can't use the users list api to look up its own userId.
- The configured product type must exist beforehand as the low privileged user isn't permitted to create a new one
- The hook will not create / link the engagement to the _secureCodeBox_ orchestration engine tool type.
- The low privileged user must have at least the `Maintainer` role in the configured product type.

#### Low Privileged Mode Install Example

```bash
kubectl create secret generic defectdojo-credentials --from-literal="apikey=08b7..."

helm upgrade --install dd secureCodeBox/persistence-defectdojo \
    --set="defectdojo.url=http://defectdojo-django.default.svc" \
    --set="defectdojo.lowPrivilegedMode=true" \
    --set="defectdojo.authentication.userId=42"
```

### DefectDojo Minimum Severity

It has come to our attention, that _DefectDojo_ become slow when handling a lot of data. A lot of data in _DefectDojo_ can be informational findings one likes to ignore. Therefore, _Defectdojo_ provides the option to only create findings for scan finding from a certain severity level and above, thus lowering the amount of data stored. We integrate this option in our scans by providing the "defectdojo.securecodebox.io/minimum_severity" annotation for scans. This is an example of how the minimum severity for findings of a scan can be set:

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScheduledScan
metadata:
  name: "zap-juiceshop"
  annotations:
      defectdojo.securecodebox.io/minimum_severity: "Low"
spec:
  interval: 24h
  scanSpec:
    scanType: "zap-full-scan"
    parameters:
      - "-t"
      - "http://juice-shop.demo-targets.svc:3000"
```
In this example only for scan findings with a severity of "Low" or higher there are findings in _DefectDojo_ created.

### Simple Example Scans

This will run a daily scan using ZAP on a demo target. The results will be imported using the name "zap-juiceshop-$UNIX_TIMESTAMP" (Name of the Scan created by the ScheduledScan), in a product called "zap-juiceshop" in the default _DefectDojo_ product type.

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScheduledScan
metadata:
  name: "zap-juiceshop"
spec:
  interval: 24h
  scanSpec:
    scanType: "zap-full-scan"
    parameters:
      - "-t"
      - "http://juice-shop.demo-targets.svc:3000"
```

### Complete Example Scan

This will import the results into engagement, product and product type following the labels. The engagement will be reused by the hook for the daily scans/imports until the engagement version is increased.

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScheduledScan
metadata:
  name: "zap-full-scan-juiceshop"
  annotations:
    defectdojo.securecodebox.io/product-type-name: "OWASP"
    defectdojo.securecodebox.io/product-name: "Juice Shop"
    defectdojo.securecodebox.io/product-description: |
      OWASP Juice Shop is probably the most modern and sophisticated insecure web application!
      It can be used in security trainings, awareness demos, CTFs and as a guinea pig for security tools!
      Juice Shop encompasses vulnerabilities from the entire OWASP Top Ten along with many other security flaws found in real-world applications!
    defectdojo.securecodebox.io/product-tags: vulnerable,appsec,owasp-top-ten,vulnapp
    defectdojo.securecodebox.io/engagement-name: "Juice Shop"
    defectdojo.securecodebox.io/engagement-version: "v12.6.1"
    defectdojo.securecodebox.io/engagement-tags: "automated,daily"
    defectdojo.securecodebox.io/engagement-deduplicate-on-engagement: "true"
    defectdojo.securecodebox.io/test-title: "Juice Shop - v12.6.1"
spec:
  interval: 24h
  scanSpec:
    scanType: "zap-full-scan"
    parameters:
      - "-t"
      - "http://juice-shop.demo-targets.svc:3000"
```

## Values

| Key                                   | Type   | Default                                                                                    | Description                                                                                                                                                                                                                                                                                                                                                 |
|---------------------------------------|--------|--------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| defectdojo.authentication.apiKeyKey   | string | `"apikey"`                                                                                 | Name of the apikey key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs                                                                                                                                                                                                                                   |
| defectdojo.authentication.userId      | string | `nil`                                                                                      | Set the userId explicitly. When not set the configured username is used to look up the userId via the DefectDojo API (which is only available for privileged users.)                                                                                                                                                                                        |
| defectdojo.authentication.userSecret  | string | `"defectdojo-credentials"`                                                                 | Link a pre-existing generic secret with `username` and `apikey` key / value pairs                                                                                                                                                                                                                                                                           |
| defectdojo.authentication.usernameKey | string | `"username"`                                                                               | Name of the username key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs                                                                                                                                                                                                                                 |
| defectdojo.lowPrivilegedMode          | bool   | `false`                                                                                    | Allows the hook to run with a users token whose access rights are restricted to one / multiple product types but doesn't have global platform rights. If set to true, the DefectDojo User ID has to be configured instead of the username (`defectdojo.authentication.userId`). User needs to have at least the `Maintainer` role in the used Product Type. |
| defectdojo.syncFindingsBack           | bool   | `true`                                                                                     | Syncs back (two way sync) all imported findings from DefectDojo to SCB Findings Store. When set to false the hook will only import the findings to DefectDojo (one way sync).                                                                                                                                                                               |
| defectdojo.url                        | string | `"http://defectdojo-django.default.svc"`                                                   | Url to the DefectDojo Instance                                                                                                                                                                                                                                                                                                                              |
| hook.affinity                         | object | `{}`                                                                                       | Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)                                                                                                                                                                                |
| hook.env                              | list   | `[]`                                                                                       | Optional environment variables mapped into the hook (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)                                                                                                                                                                                                  |
| hook.extraVolumeMounts                | list   | `[]`                                                                                       | Optional VolumeMounts mapped into the hook (see: https://kubernetes.io/docs/concepts/storage/volumes/)                                                                                                                                                                                                                                                      |
| hook.extraVolumes                     | list   | `[]`                                                                                       | Optional Volumes mapped into the hook (see: https://kubernetes.io/docs/concepts/storage/volumes/)                                                                                                                                                                                                                                                           |
| hook.image.pullPolicy                 | string | `"IfNotPresent"`                                                                           | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images                                                                                                                                          |
| hook.image.repository                 | string | `"docker.io/securecodebox/hook-persistence-defectdojo"`                                    | Hook image repository                                                                                                                                                                                                                                                                                                                                       |
| hook.image.tag                        | string | defaults to the charts version                                                             | Container image tag                                                                                                                                                                                                                                                                                                                                         |
| hook.labels                           | object | `{}`                                                                                       | Add Kubernetes Labels to the hook definition                                                                                                                                                                                                                                                                                                                |
| hook.priority                         | int    | `0`                                                                                        | Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks.                                                                                                                                                                                                                                                                   |
| hook.resources                        | object | `{ requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } }` | Optional resources lets you control resource limits and requests for the hook container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/                                                                                                                                                                                 |
| hook.tolerations                      | list   | `[]`                                                                                       | Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)                                                                                                                                                                                               |
| hook.ttlSecondsAfterFinished          | string | `nil`                                                                                      | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/                                                                                                                                                       |
| imagePullSecrets                      | list   | `[]`                                                                                       | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)                                                                                                                                                                                                        |

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of _secureCodeBox_ is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]:    https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]:     https://www.securecodebox.io/
[scb-site]:     https://www.securecodebox.io/
[scb-github]:   https://github.com/secureCodeBox/
[scb-mastodon]: https://infosec.exchange/@secureCodeBox
[scb-slack]:    https://owasp.org/slack/invite
[scb-license]:  https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

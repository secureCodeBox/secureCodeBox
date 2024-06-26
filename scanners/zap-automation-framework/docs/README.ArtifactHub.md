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

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://www.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on Kubernetes

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

## What is ZAP?

The [Zed Attack Proxy (ZAP)][zap project] is one of the world’s most popular free security tools and is actively maintained by hundreds of international volunteers*. It can help you automatically find security vulnerabilities in your web applications while you are developing and testing your applications. It's also a great tool for experienced pentesters to use for manual security testing.

The Automation Framework is an add-on that provides a framework that allows ZAP to be automated in an easy and flexible way.
To learn more about the ZAP scanner itself visit [https://www.zaproxy.org/](https://www.zaproxy.org/).
To learn more about the ZAP Automation Framework itself visit [https://www.zaproxy.org/docs/desktop/addons/automation-framework/](https://www.zaproxy.org/docs/desktop/addons/automation-framework/).

## Deployment
The zap-automation-framework chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install zap-automation-framework oci://ghcr.io/securecodebox/helm/zap-automation-framework
```

## Migration to ZAP Automation Framework

### Migration from `zap` to `ZAP Automation Framework`
The `zap` scanner already uses the ZAP Automation Framework under the hood. It is done through `zap-baseline`, `zap-api-scan.py` and `zap-full-scan` scripts. The `zap` scanner is a wrapper around these scripts.
The use of a configMap with `ZAP Automation Framework` can replace those scripts. For example, a `zap-baseline` scan can be replaced with a `zap-automation-framework` scan using the following ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: "zap-automation-framework-config"
data:
  automation.yaml: |-

    env:                                   # The environment, mandatory
      contexts :                           # List of 1 or more contexts, mandatory
        - name: zap-baseline-automation-scan # Name to be used to refer to this context in other jobs, mandatory
          urls: ["http://juiceshop.demo-targets.svc:3000/"] # A mandatory list of top level urls, everything under each url will be included
    jobs:
      - type: spider                       # The traditional spider - fast but doesnt handle modern apps so well
        parameters:
          context: zap-baseline-automation-scan  # String: Name of the context to spider, default: first context
          maxDuration: 1                     # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
      - type: passiveScan-wait             # Passive scan wait for the passive scanner to finish
        parameters:
          maxDuration: 5                   # Int: The max time to wait for the passive scanner, default: 0 unlimited
      - type: report                       # Report generation
        parameters:
          template: traditional-xml                        # String: The template id, default : modern
          reportDir: /home/securecodebox/               # String: The directory into which the report will be written
          reportFile: zap-results                     # String: The report file name pattern, default: [[yyyy-MM-dd]]-ZAP-Report-[[site]]
        risks:                             # List: The risks to include in this report, default all
          - high
          - medium
          - low
```

### Migration from `zap-advanced` to `ZAP Automation Framework`
To use the `ZAP Automation Framework` with the same functionality as the `zap-advanced` scan, you can modify the ConfigMap used for the `zap-advanced` to fit  with the `ZAP Automation Framework`. They are very similar in functionality.
For example the following `zap-advanced` scan:
<details>
  <summary>ZAP-Advanced</summary>
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: zap-advanced-scan-config
data:
  zap-advanced-scan.yaml: |-

    # ZAP Contexts Configuration
    contexts:
      # Name to be used to refer to this context in other jobs, mandatory
      - name: scb-bodgeit-context
        # The top level url, mandatory, everything under this will be included
        url: http://bodgeit.default.svc:8080/bodgeit/
        # An optional list of regexes to include
        includePaths:
          - "http://bodgeit.default.svc:8080/bodgeit.*"
        # An optional list of regexes to exclude
        excludePaths:
          - "http://bodgeit.default.svc:8080/bodgeit/logout.jsp"
          - ".*\\.js"
          - ".*\\.css"
          - ".*\\.png"
          - ".*\\.jpeg"
        # Auth Credentials for the scanner to access the application
        # Can be either basicAuth or a oidc token.
        # If both are set, the oidc token takes precedent
        authentication:
          # Currently supports "basic-auth", "form-based", "json-based", "script-based"
          type: "form-based"
          # basic-auth requires no further configuration
          form-based:
            loginUrl: "http://bodgeit.default.svc:8080/bodgeit/login.jsp"
            # must be escaped already to prevent yaml parser colidations 'username={%username%}&password={%password%}''
            loginRequestData: "username%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D"
          # Indicates if the current Zap User Session is based on a valid authentication (loggedIn) or not (loggedOut)
          verification:
            isLoggedInIndicator: '\Q<a href="password.jsp">\E'
            isLoggedOutIndicator: '\QGuest user\E'
        users:
          - name: bodgeit-user-1
            username: test@thebodgeitstore.com
            password: password
            forced: true
        session:
          # Currently supports "scriptBasedSessionManagement", "cookieBasedSessionManagement", "httpAuthSessionManagement"
          type: "cookieBasedSessionManagement"

    # ZAP Spiders Configuration
    spiders:
      - name: scb-bodgeit-spider
        # String: Name of the context to spider, default: first context
        context: scb-bodgeit-context
        # String: Name of the user to authenticate with and used to spider
        user: bodgeit-user-1
        # String: Url to start spidering from, default: first context URL
        url: http://bodgeit.default.svc:8080/bodgeit/
        # Int: Fail if spider finds less than the specified number of URLs, default: 0
        failIfFoundUrlsLessThan: 0
        # Int: Warn if spider finds less than the specified number of URLs, default: 0
        warnIfFoundUrlsLessThan: 0
        # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
        maxDuration: 3
        # Int: The maximum tree depth to explore, default 5
        maxDepth: 5
        # Int: The maximum number of children to add to each node in the tree                    
        maxChildren: 10
        # String: The user agent to use in requests, default: '' - use the default ZAP one              
        userAgent: "secureCodeBox / ZAP Spider"

    # ZAP ActiveScans Configuration
    scanners:
      - name: scb-bodgeit-scan
        # String: Name of the context to attack, default: first context
        context: scb-bodgeit-context
        # String: Name of the user to authenticate with and used to spider
        user: bodgeit-user-1
        # String: Url to start scaning from, default: first context URL
        url: http://bodgeit.default.svc:8080/bodgeit/
        # Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited
        maxRuleDurationInMins: 3
        # Int: The max time in minutes the active scanner will be allowed to run for, default: 0 unlimited         
        maxScanDurationInMins: 10
        # Int: The max number of threads per host, default: 2
        threadPerHost: 2
        # Int: The delay in milliseconds between each request, use to reduce the strain on the target, default 0
        delayInMs: 0
        # Bool: If set will add an extra query parameter to requests that do not have one, default: false
        addQueryParam: false
        # Bool: If set then automatically handle anti CSRF tokens, default: false
        handleAntiCSRFTokens: false
        # Bool: If set then the relevant rule Id will be injected into the X-ZAP-Scan-ID header of each request, default: false          
        injectPluginIdInHeader: false
        # Bool: If set then the headers of requests that do not include any parameters will be scanned, default: false
        scanHeadersAllRequests: false
---
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "zap-authenticated-full-scan-bodgeit"
  labels:
    organization: "OWASP"
spec:
  scanType: "zap-advanced-scan"
  parameters:
    # target URL including the protocol
    - "-t"
    - "http://bodgeit.default.svc:8080/bodgeit/"
  volumeMounts:
    - name: zap-advanced-scan-config
      mountPath: /home/securecodebox/configs/2-zap-advanced-scan.yaml
      subPath: 2-zap-advanced-scan.yaml
      readOnly: true
  volumes:
    - name: zap-advanced-scan-config
      configMap:
        name: zap-advanced-scan-config

```
</details>

can be replaced with the following `ZAP Automation Framework` scan:
<details>
  <summary>ZAP-Automation-Framework</summary>
```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: "zap-automation-framework-migrate-advanced-scan-config"
data:
  automation.yaml: |-

    env:                                   # The environment, mandatory
      contexts :                           # List of 1 or more contexts, mandatory
        - name: scb-bodgeit-context        # Name to be used to refer to this context in other jobs, mandatory
          urls: [http://bodgeit.default.svc:8080/bodgeit/]  # A mandatory list of top level urls, everything under each url will be included
          includePaths:                    # An optional list of regexes to include
            - "http://bodgeit.default.svc:8080/bodgeit.*"
          excludePaths:                    # An optional list of regexes to exclude
            - "http://bodgeit.default.svc:8080/bodgeit/logout.jsp"
            - ".*\\.js"
            - ".*\\.css"
            - ".*\\.png"
            - ".*\\.jpeg"
          authentication:
            method: form                   # String, one of 'manual', 'http', 'form', 'json' or 'script'
            parameters:                    # May include any required for scripts. All of the parameters support vars except for the port
              loginRequestUrl: "http://bodgeit.default.svc:8080/bodgeit/login.jsp" # String, the login URL to request, only for 'form' or 'json' authentication
              loginRequestBody: "username%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D" # String, the login request body - if not supplied a GET request will be used, only for 'form' or 'json' authentication
            verification:
              method: response                     # String, one of 'response', 'request', 'both', 'poll'
              loggedInRegex: '\Q<a href="password.jsp">\E'  # String, regex pattern for determining if logged in
              loggedOutRegex: '\QGuest user\E'  # String, regex pattern for determining if logged out
          users:                           # List of one or more users available to use for authentication
          - name: bodgeit-user-1                         # String, the name to be used by the jobs
            credentials:                   # List of user credentials - may include any required for scripts, vars supported
              username: test@thebodgeitstore.com  # String, the username to use when authenticating
              password: password                    # String, the password to use when authenticating
          sessionManagement:
            method: cookie                      # String, one of 'cookie', 'http', 'script'

    jobs:
      - type: spider                       # The traditional spider - fast but doesnt handle modern apps so well
        parameters:
          context: scb-bodgeit-context     # String: Name of the context to spider, default: first context
          user: bodgeit-user-1             # String: An optional user to use for authentication, must be defined in the env
          url: http://bodgeit.default.svc:8080/bodgeit/  # String: Url to start spidering from, default: first context URL
          maxDuration: 3                   # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
          maxDepth: 5                      # Int: The maximum tree depth to explore, default 5
          maxChildren: 10                  # Int: The maximum number of children to add to each node in the tree
          userAgent: "secureCodeBox / ZAP Spider" # String: The user agent to use in requests, default: '' - use the default ZAP one   
      - type: activeScan                   # The active scanner - this actively attacks the target so should only be used with permission
        parameters:
          context: scb-bodgeit-context     # String: Name of the context to attack, default: first context
          user: bodgeit-user-1             # String: An optional user to use for authentication, must be defined in the env
          maxRuleDurationInMins: 3         # Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited
          maxScanDurationInMins: 10        # Int: The max time in minutes the active scanner will be allowed to run for, default: 0 unlimited
          addQueryParam: false              # Bool: If set will add an extra query parameter to requests that do not have one, default: false
          delayInMs: 0                     # Int: The delay in milliseconds between each request, use to reduce the strain on the target, default 0
          handleAntiCSRFTokens: false      # Bool: If set then automatically handle anti CSRF tokens, default: false
          injectPluginIdInHeader: false    # Bool: If set then the relevant rule Id will be injected into the XZAPScanID header of each request, default: false
          scanHeadersAllRequests: false    # Bool: If set then the headers of requests that do not include any parameters will be scanned, default: false
          threadPerHost: 2                 # Int: The max number of threads per host, default: 2
      - type: report                       # Report generation
        parameters:
          template: traditional-xml                        # String: The template id, default : modern
          reportDir: /home/securecodebox/               # String: The directory into which the report will be written
          reportFile: zap-results                     # String: The report file name pattern, default: [[yyyy-MM-dd]]-ZAP-Report-[[site]]
        risks:                             # List: The risks to include in this report, default all
          - high
          - medium
          - low
---
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "zap-automation-framework-juice-shop-advanced-migrated"
  labels:
    organization: "OWASP"
spec:
  scanType: "zap-automation-framework"
  parameters:
    - "-autorun"
    - "/home/securecodebox/scb-automation/1-automation.yaml"
  volumeMounts:
    - name: zap-automation-framework-migrate-advanced-scan-config
      mountPath: /home/securecodebox/scb-automation/1-automation.yaml
      subPath: 1-automation.yaml
  volumes:
    - name: zap-automation-framework-migrate-advanced-scan-config
      configMap:
        name: zap-automation-framework-migrate-advanced-scan-config
```
</details>
### Script-Based authentication
Scripts and script-based authentication (for OAuth for example) are also easily implemented. For a guide see our blogpost ["Automate ZAP with Authentication"](/blog/2023/09/01/automate-zap-with-authentication).
## Scanner Configuration
The Automation Framework allows for higher flexibility in configuring ZAP scans. Its goal is the automation of the full functionality of ZAP's GUI. The configuration of the Automation Framework differs from the other three ZAP scan types. The following security scan configuration example highlights the differences for running a `zap-automation-framework` scan.
Of particular interest for us will be the -autorun option. `zap-automation-framework` allows for providing an automation file as a ConfigMap that defines the details of the scan. See the secureCodeBox based ZAP Automation example listed below for what such a ConfigMap would look like.

```bash
Usage: zap.sh -cmd -host <target> [options]
    -t target         target URL including the protocol, eg https://www.example.com
Add-on options:
    -script <script>          Run the specified script from commandline or load in GUI
    -addoninstall <addOnId>   Installs the add-on with specified ID from the ZAP Marketplace
    -addoninstallall          Install all available add-ons from the ZAP Marketplace
    -addonuninstall <addOnId> Uninstalls the Add-on with specified ID
    -addonupdate              Update all changed add-ons from the ZAP Marketplace
    -addonlist                List all of the installed add-ons
    -certload <path>          Loads the Root CA certificate from the specified file name
    -certpubdump <path>       Dumps the Root CA public certificate into the specified file name, this is suitable for importing into browsers
    -certfulldump <path>      Dumps the Root CA full certificate (including the private key) into the specified file name, this is suitable for importing into ZAP
    -notel                    Turns off telemetry calls
    -hud                      Launches a browser configured to proxy through ZAP with the HUD enabled, for use in daemon mode
    -hudurl <url>             Launches a browser as per the -hud option with the specified URL
    -hudbrowser <browser>     Launches a browser as per the -hud option with the specified browser, supported options: Chrome, Firefox by default 'Firefox'
    -openapifile <path>       Imports an OpenAPI definition from the specified file name
    -openapiurl <url>         Imports an OpenAPI definition from the specified URL
    -openapitargeturl <url>   The Target URL, to override the server URL present in the OpenAPI definition. Refer to the help for supported format.
    -quickurl <target url>    The URL to attack, e.g. http://www.example.com
    -quickout <filename>      The file to write the HTML/JSON/MD/XML results to (based on the file extension)
    -autorun <filename>       Run the automation jobs specified in the file.
    -autogenmin <filename>    Generate template automation file with the key parameters.
    -autogenmax <filename>    Generate template automation file with all parameters.
    -autogenconf <filename>   Generate template automation file using the current configuration.
    -graphqlfile <path>       Imports a GraphQL Schema from a File
    -graphqlurl <url>         Imports a GraphQL Schema from a URL
    -graphqlendurl <url>      Sets the Endpoint URL
```

## Requirements

Kubernetes: `>=v1.11.0-0`

The ZAP Automation Scanner supports the use of secrets, as to not have hardcoded credentials in the scan definition.
Generate secrets using the credentials that will later be used in the scan for authentication. Supported authentication methods for the ZAP Authentication scanner are Manual, HTTP / NTLM, Form-based, JSON-based, and Script-based.

```bash
kubectl create secret generic unamesecret --from-literal='username=<USERNAME>'
kubectl create secret generic pwordsecret --from-literal='password=<PASSWORD>'
```

You can now include the secrets in the scan definition and reference them in the ConfigMap that defines the scan options.
A ZAP Automation scan using JSON-based authentication may look like this:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: "zap-automation-framework-config"
data:
  automation.yaml: |-

    env:                                   # The environment, mandatory
      contexts:                           # List of 1 or more contexts, mandatory
        - name: test-config                  # Name to be used to refer to this context in other jobs, mandatory
          urls: ["http://juiceshop.demo-targets.svc:3000"]                           # A mandatory list of top level urls, everything under each url will be included
          includePaths:
            - "http://juiceshop.demo-targets.svc:3000/.*"                   # An optional list of regexes to include
          excludePaths:
            - ".*socket\\.io.*"
            - ".*\\.png"
            - ".*\\.jpeg"
            - ".*\\.jpg"
            - ".*\\.woff"
            - ".*\\.woff2"
            - ".*\\.ttf"
            - ".*\\.ico"                  
          authentication:
            method: "json"
            parameters:
              loginPageUrl: "http://juiceshop.demo-targets.svc:3000/rest/user"
              loginRequestUrl: "http://juiceshop.demo-targets.svc:3000/rest/user/login"
              loginRequestBody: '{"email":"${EMAIL}","password":"${PASS}"}'
            verification:
              method: "response"
              loggedOutRegex: '\Q{"user":{}}\E'
              loggedInRegex: '\Q<a href="password.jsp">\E'
          users:
          - name: "juiceshop-user-1"
            credentials:
              username: "${EMAIL}"
              password: "${PASS}"
      parameters:
        failOnError: true                  # If set exit on an error        
        failOnWarning: false               # If set exit on a warning
        progressToStdout: true             # If set will write job progress to stdout

    jobs:
      - type: passiveScan-config           # Passive scan configuration
        parameters:
          maxAlertsPerRule: 10             # Int: Maximum number of alerts to raise per rule
          scanOnlyInScope: true            # Bool: Only scan URLs in scope (recommended)
      - type: spider                       # The traditional spider - fast but doesnt handle modern apps so well
        parameters:
          context: test-config                        # String: Name of the context to spider, default: first context
          user: juiceshop-user-1                           # String: An optional user to use for authentication, must be defined in the env
          maxDuration: 2                     # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
      - type: spiderAjax                   # The ajax spider - slower than the spider but handles modern apps well
        parameters:
          context: test-config                         # String: Name of the context to spider, default: first context
          maxDuration: 2                     # Int: The max time in minutes the ajax spider will be allowed to run for, default: 0 unlimited
      - type: passiveScan-wait             # Passive scan wait for the passive scanner to finish
        parameters:
          maxDuration: 10                   # Int: The max time to wait for the passive scanner, default: 0 unlimited
      - type: report                       # Report generation
        parameters:
          template: traditional-xml                        # String: The template id, default : modern
          reportDir: /home/securecodebox/               # String: The directory into which the report will be written
          reportFile: zap-results                     # String: The report file name pattern, default: [[yyyy-MM-dd]]-ZAP-Report-[[site]]
        risks:                             # List: The risks to include in this report, default all
          - high
          - medium
          - low
---
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "zap-example-scan"
spec:
  scanType: "zap-automation-framework"
  parameters:
    - "-autorun"
    - "/home/securecodebox/scb-automation/1-automation.yaml"
  volumeMounts:
    - mountPath: /home/securecodebox/scb-automation/1-automation.yaml
      name: zap-automation
      subPath: 1-automation.yaml
  volumes:
    - name: zap-automation
      configMap:
        name: zap-automation-scan-config
  env:
    - name: EMAIL
      valueFrom:
        secretKeyRef:
          name: unamesecret
          key: username
    - name: PASS
      valueFrom:
        secretKeyRef:
          name: pwordsecret
          key: password
```

For a complete overview of all the possible options you have for configuring a ZAP Automation scan, run
```bash
./zap.sh -cmd -autogenmax zap.yaml
```
For an overview of all required configuration options, run
```
bash ./zap.sh -cmd -autogenmin zap.yaml
```
Alternatively, have a look at the [official documentation](https://www.zaproxy.org/docs/desktop/addons/automation-framework/).

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `false` | Enables or disables the installation of the default cascading rules for this scanner |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| parser.affinity | object | `{}` | Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| parser.env | list | `[]` | Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| parser.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parser.image.repository | string | `"docker.io/securecodebox/parser-zap-automation-framework"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.nodeSelector | object | `{}` | Optional nodeSelector settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/) |
| parser.resources | object | `{ requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } }` | Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| parser.scopeLimiterAliases | object | `{}` | Optional finding aliases to be used in the scopeLimiter. |
| parser.tolerations | list | `[]` | Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the Kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.activeDeadlineSeconds | string | `nil` | There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup) |
| scanner.affinity | object | `{}` | Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.envFrom | list | `[]` | Optional mount environment variables from configMaps or secrets (see: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#configure-all-key-value-pairs-in-a-secret-as-container-environment-variables) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[{"mountPath":"/zap/wrk","name":"zap-workdir"}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[{"emptyDir":{},"name":"zap-workdir"}]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| scanner.image.repository | string | `"softwaresecurityproject/zap-stable"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts appVersion |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.nodeSelector | object | `{}` | Optional nodeSelector settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/) |
| scanner.podSecurityContext | object | `{}` | Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":false,"runAsNonRoot":false}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scanner.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scanner.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scanner.securityContext.readOnlyRootFilesystem | bool | `false` | Prevents write access to the containers file system |
| scanner.securityContext.runAsNonRoot | bool | `false` | Enforces that the scanner image is run as a non root user |
| scanner.suspend | bool | `false` | if set to true the scan job will be suspended after creation. You can then resume the job using `kubectl resume <jobname>` or using a job scheduler like kueue |
| scanner.tolerations | list | `[]` | Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the Kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

## Contributing

Contributions are welcome and extremely helpful 🙌
Please have a look at [Contributing](./CONTRIBUTING.md)

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [OWASP Slack (Channel #project-securecodebox)][scb-slack]
- [Mastodon][scb-mastodon]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]:    https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]:     https://www.securecodebox.io/
[scb-site]:     https://www.securecodebox.io/
[scb-github]:   https://github.com/secureCodeBox/
[scb-mastodon]: https://infosec.exchange/@secureCodeBox
[scb-slack]:    https://owasp.org/slack/invite
[scb-license]:  https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[zap owasp project]: https://owasp.org/www-project-zap/
[zap github]: https://github.com/zaproxy/zaproxy/
[zap user guide]: https://www.zaproxy.org/docs/
[zap automation framework]: https://www.zaproxy.org/docs/desktop/addons/automation-framework/

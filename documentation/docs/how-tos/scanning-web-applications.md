---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Scanning Web Applications"
description: "Automating ZAP with the secureCodeBox"
sidebar_position: 3
---

## Introduction

In this step-by-step tutorial, we will go through all the required stages to set up an in depth configured ZAP Scan against OWASP Juice Shop with the secureCodeBox.

## Setup

For the sake of the tutorial, we assume that you have your Kubernetes cluster already up and running and that we can work in your default namespace. If not, check out the [installation](/docs/getting-started/installation/) for more information.

We will start by installing the ZAP Automation Framework scanner:

```bash
helm upgrade --install zap-automation-framework oci://ghcr.io/securecodebox/helm/zap-automation-framework
```

And the juice-shop demo-target.

```bash
helm upgrade --install juice-shop oci://ghcr.io/securecodebox/helm/juice-shop
```

## Creating the ZAP Automation Framework scan

We can first start with a basic `zap-automation-framework` scan. We use here our CRD (Custom Resource definition) [Scan](/docs/api/crds/scan) and a [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/) to configure our scan.

```yaml title="scan.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: baseline-config
data:
  automation.yaml: |-

    env:                                   # The environment, mandatory
      contexts:                            # List of 1 or more contexts, mandatory
        - name: baseline-config            # Name to be used to refer to this context in other jobs, mandatory
          # A mandatory list of top level urls, everything under each url will be included
          urls: ["http://juice-shop.demo-targets.svc:3000/"]
    jobs:
      - type: report                       # Report generation
        parameters:
          template: traditional-xml        # String: The template id, default : modern
          reportDir: /home/securecodebox/  # String: The directory into which the report will be written
          reportFile: zap-results          # String: The report file name pattern, default: {{yyyy-MM-dd}}-ZAP-Report-[[site]]

---
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "zap-automation-framework-juice-shop"
  labels:
    organization: "OWASP"
spec:
  scanType: "zap-automation-framework"
  parameters:
    - "-autorun"
    - "/home/securecodebox/scb-automation/automation.yaml"
  volumeMounts:
    - name: baseline-config
      mountPath: /home/securecodebox/scb-automation/automation.yaml
      subPath: automation.yaml
  volumes:
    - name: baseline-config
      configMap:
        name: baseline-config
```

We use `volumeMounts` and `volumes` to attach the configMap to our scan in `scan.yaml`. We also set up a context for our `zap-automation-framework` scan. This is where we can input ZAP related parameters.
The field `jobs.type: report` describes the output format and directory of the result file. This is a mendadory field. 

We can do a test run via:

```bash
kubectl apply -f scan.yaml
```

The ConfigMap right now is minimal. So we can start modifying and adding to it to fit our needs.  
For example, let's start by setting the scope that we want for our scan. This is done by adding and excluding the paths that the scanner will use. This usually makes the scans faster.  
Our ConfigMap will then look like this.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: baseline-config
data:
  automation.yaml: |-

    env:                                   # The environment, mandatory
      contexts :                           # List of 1 or more contexts, mandatory
        - name: baseline-config            # Name to be used to refer to this context in other jobs, mandatory
          # A mandatory list of top level urls, everything under each url will be included
          urls: ["http://juice-shop.demo-targets.svc:3000/"]

          # An optional list of regexes to include     
          includePaths:
            - "http://juice-shop.default.svc:3000.*"
          # An optional list of regexes to exclude
          excludePaths:
            - ".*socket\\.io.*"
            - ".*\\.png"
            - ".*\\.jpeg"
            - ".*\\.jpg"
            - ".*\\.woff"
            - ".*\\.woff2"
            - ".*\\.ttf"
            - ".*\\.ico"
    jobs:
      - type: report                       # Report generation
        parameters:
          template: traditional-xml        # String: The template id, default : modern
          reportDir: /home/securecodebox/  # String: The directory into which the report will be written
          reportFile: zap-results          # String: The report file name pattern, default: {{yyyy-MM-dd}}-ZAP-Report-[[site]]
```

ZAP uses a [Spider-Tool](https://www.zaproxy.org/docs/desktop/start/features/spider/) to automatically discover new resources (URLs) on a particular site. We can configure its mode of operation through `jobs.type`. Here we use the Ajax scanner as it is more suitable for modern web-applications. For a faster run you can use the default spider with `type: spider`.

A possible configuration can look like this:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: baseline-config
data:
  automation.yaml: |-

    env:                                   # The environment, mandatory
      contexts :                           # List of 1 or more contexts, mandatory
        - name: baseline-config            # Name to be used to refer to this context in other jobs, mandatory
          # A mandatory list of top level urls, everything under each url will be included
          urls: ["http://juice-shop.demo-targets.svc:3000/"]

          # An optional list of regexes to include     
          includePaths:
            - "http://juice-shop.demo-targets.svc:3000.*"
          # An optional list of regexes to exclude
          excludePaths:
            - ".*socket\\.io.*"
            - ".*\\.png"
            - ".*\\.jpeg"
            - ".*\\.jpg"
            - ".*\\.woff"
            - ".*\\.woff2"
            - ".*\\.ttf"
            - ".*\\.ico"
    # ZAP Spiders Configuration 
    jobs:                                  
      - type: spiderAjax                   # We use a modern spider since the juice-shop is a modern web-application  
        parameters:
          # String: Name of the context to spider, default: first context
          context: scb-juiceshop-context
          # String: Name of the user to authenticate with and used to spider
          user: "admin@juice-sh.op"
          # String: Url to start spidering from, default: first context URL
          url: http://juice-shop.default.svc:3000/
          browserId: firefox-headless
          # Elemets to exclude from the spider
          excludedElements:
          - description: Logout
            element: span
            text: Logout
          # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
          maxDuration: 5

      - type: report                       # Report generation
        parameters:
          template: traditional-xml        # String: The template id, default : modern
          reportDir: /home/securecodebox/  # String: The directory into which the report will be written
          reportFile: zap-results 
```

ZAP also has the option for an [Active Scan](https://www.zaproxy.org/docs/desktop/start/features/ascan/).  
Active scanning attempts to find potential vulnerabilities by using known attacks against the selected targets. Its rules can be modified in the `jobs.types: activeScan` parameter. An example for that would be:

```yaml
# ZAP ActiveScans Configuration
jobs:
  # The active scanner - this actively attacks the target so should only be used with permission
  type: activeScan                         
    parameters:
      name: scb-juiceshop-scan
      # String: Name of the context to attack, default: first context
      context: scb-juiceshop-context
      # String: Name of the user to authenticate with and used to spider
      user: "test@test.com"
      # String: Url to start scaning from, default: first context URL
      url: http://juice-shop.default.svc:3000/
      # Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited
      maxRuleDurationInMins: 1
      # Int: The max time in minutes the active scanner will be allowed to run for, default: 0 unlimited
      maxScanDurationInMins: 10
      # Int: The max number of threads per host, default: 2
      threadPerHost: 5
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
```

Some URLs may not be reachable without privileged user rights. In this case, it makes sense to provide authentications credentials. This is done through the `authentication`, `users` and `session` parameters in our ConfigMap context. For the Juice Shop there is an example for authentication on the [ZAP website](https://www.zaproxy.org/docs/testapps/juiceshop/) 
Our `contexts` parameter in our scan would then look something like this:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: baseline-config
data:
  automation.yaml: |-

    env:                                   # The environment, mandatory
      contexts:                            # List of 1 or more contexts, mandatory
        - name: scb-juiceshop-context      # Name to be used to refer to this context in other jobs, mandatory
          # A mandatory list of top level urls, everything under each url will be included
          urls: ["http://juice-shop.demo-targets.svc:3000/"]
          # An optional list of regexes to include
          includePaths:
            - "http://juice-shop.default.svc:3000.*"
          # An optional list of regexes to exclude
          excludePaths:
            - ".*socket\\.io.*"
            - ".*\\.png"
            - ".*\\.jpeg"
            - ".*\\.jpg"
            - ".*\\.woff"
            - ".*\\.woff2"
            - ".*\\.ttf"
            - ".*\\.ico"
          # Auth Credentials for the scanner to access the application
          authentication:
            method: "browser"
            parameters:
              loginPageUrl: "http://juice-shop.demo-targets.svc:3000/#/login"
              browserId: "firefox-headless"
              loginPageWait: 5
            verification:
              method: "poll"
              loggedInRegex: "\\Qadmin@juice-sh.op\\E"
              loggedOutRegex: ""
              pollFrequency: 60
              pollUnits: "requests"
              pollUrl: "http://juice-shop.demo-targets.svc:3000/rest/user/whoami"
              pollPostData: ""
          sessionManagement:
            method: headers
            parameters:
              Authorization: "Bearer {%json:authentication.token%}"
              cookie: "token={%json:authentication.token%}"
          users:
          - name: "admin@juice-sh.op"
            credentials:
              password: "admin123"
              username: "admin@juice-sh.op"
    # ZAP Spiders Configuration 
    jobs:
      - type: spiderAjax                   # We use a modern spider since the juice-shop is a modern web-application  
        parameters:
          # String: Name of the context to spider, default: first context
          context: scb-juiceshop-context
          # String: Name of the user to authenticate with and used to spider
          user: "admin@juice-sh.op"
          # String: Url to start spidering from, default: first context URL
          url: http://juice-shop.default.svc:3000/
          browserId: firefox-headless
          # Elemets to exclude from the spider
          excludedElements:
          - description: Logout
            element: span
            text: Logout
          # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
          maxDuration: 5

      # ZAP ActiveScans Configuration
      - type: activeScan                   # The active scanner - this actively attacks the target so should only be used with permission
        parameters:
          # String: Name of the context to attack, default: first context
          context: scb-juiceshop-context
          # String: Name of the user to authenticate with and used to spider
          user: "admin@juice-sh.op"
          # Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited
          maxRuleDurationInMins: 3         # Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited
          maxScanDurationInMins: 10        # Int: The max time in minutes the active scanner will be allowed to run for, default: 0 unlimited
          addQueryParam: false             # Bool: If set will add an extra query parameter to requests that do not have one, default: false
          delayInMs: 0                     # Int: The delay in milliseconds between each request, use to reduce the strain on the target, default 0
          handleAntiCSRFTokens: false      # Bool: If set then automatically handle anti CSRF tokens, default: false
          injectPluginIdInHeader: false    # Bool: If set then the relevant rule Id will be injected into the X-ZAP-Scan-ID header of each request, default: false
          scanHeadersAllRequests: false    # Bool: If set then the headers of requests that do not include any parameters will be scanned, default: false
          threadPerHost: 2                 # Int: The max number of threads per host, default: 2
      - type: report                       # Report generation
        parameters:
          template: traditional-xml        # String: The template id, default : modern
          reportDir: /home/securecodebox/  # String: The directory into which the report will be written
          reportFile: zap-results
```

:::note
For more information on Authentication/Session parameters check out ZAP's documentation on the matter [here](https://www.zaproxy.org/docs/desktop/start/features/authentication/).
:::

Our complete ZAP Scan file is then the following :

```yaml title="scan.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: baseline-config
data:
  automation.yaml: |-

    env:                                   # The environment, mandatory
      contexts :                           # List of 1 or more contexts, mandatory
        - name: scb-juiceshop-context      # Name to be used to refer to this context in other jobs, mandatory
          # A mandatory list of top level urls, everything under each url will be included
          urls: ["http://juice-shop.demo-targets.svc:3000/"]
          # An optional list of regexes to include
          includePaths:
            - "http://juice-shop.default.svc:3000.*"
          # An optional list of regexes to exclude
          excludePaths:
            - ".*socket\\.io.*"
            - ".*\\.png"
            - ".*\\.jpeg"
            - ".*\\.jpg"
            - ".*\\.woff"
            - ".*\\.woff2"
            - ".*\\.ttf"
            - ".*\\.ico"
          # Auth Credentials for the scanner to access the application
          authentication:
            method: "browser"
            parameters:
              loginPageUrl: "http://juice-shop.demo-targets.svc:3000/#/login"
              browserId: "firefox-headless"
              loginPageWait: 5
            verification:
              method: "poll"
              loggedInRegex: "\\Qadmin@juice-sh.op\\E"
              loggedOutRegex: ""
              pollFrequency: 60
              pollUnits: "requests"
              pollUrl: "http://juice-shop.demo-targets.svc:3000/rest/user/whoami"
              pollPostData: ""
          sessionManagement:
            method: headers
            parameters:
              Authorization: "Bearer {%json:authentication.token%}"
              cookie: "token={%json:authentication.token%}"
          users:
          - name: "admin@juice-sh.op"
            credentials:
              password: "admin123"
              username: "admin@juice-sh.op"
    # ZAP Spiders Configuration 
    jobs:
      - type: spiderAjax                   # We use a modern spider since the juice-shop is a modern web-application  
        parameters:
          # String: Name of the context to spider, default: first context
          context: scb-juiceshop-context
          # String: Name of the user to authenticate with and used to spider
          user: "admin@juice-sh.op"
          # String: Url to start spidering from, default: first context URL
          url: http://juice-shop.default.svc:3000/
          browserId: firefox-headless
          # Elemets to exclude from the spider
          excludedElements:
          - description: Logout
            element: span
            text: Logout
          # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
          maxDuration: 5

      # ZAP ActiveScans Configuration 
      - type: activeScan                   # The active scanner - this actively attacks the target so should only be used with permission
        parameters:
          # String: Name of the context to attack, default: first context
          context: scb-juiceshop-context
          # String: Name of the user to authenticate with and used to spider
          user: "admin@juice-sh.op"
          # Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited
          maxRuleDurationInMins: 3         # Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited
          maxScanDurationInMins: 10        # Int: The max time in minutes the active scanner will be allowed to run for, default: 0 unlimited
          addQueryParam: false             # Bool: If set will add an extra query parameter to requests that do not have one, default: false
          delayInMs: 0                     # Int: The delay in milliseconds between each request, use to reduce the strain on the target, default 0
          handleAntiCSRFTokens: false      # Bool: If set then automatically handle anti CSRF tokens, default: false
          injectPluginIdInHeader: false    # Bool: If set then the relevant rule Id will be injected into the X-ZAP-Scan-ID header of each request, default: false
          scanHeadersAllRequests: false    # Bool: If set then the headers of requests that do not include any parameters will be scanned, default: false
          threadPerHost: 2                 # Int: The max number of threads per host, default: 2
      - type: report                       # Report generation
        parameters:
          template: traditional-xml        # String: The template id, default : modern
          reportDir: /home/securecodebox/  # String: The directory into which the report will be written
          reportFile: zap-results   
---
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "zap-automation-framework-juice-shop"
  labels:
    organization: "OWASP"
spec:
  scanType: "zap-automation-framework"
  parameters:
    - "-autorun"
    - "/home/securecodebox/scb-automation/automation.yaml"
  volumeMounts:
    - name: baseline-config
      mountPath: /home/securecodebox/scb-automation/automation.yaml
      subPath: automation.yaml
  volumes:
    - name: baseline-config
      configMap:
        name: baseline-config
```

Let's delete our first test scan and run a new one via :

```bash
# Delete the scan created from scan.yaml:
kubectl delete -f scan.yaml
# Run the scan from scan.yaml:
kubectl apply -f scan.yaml
```

We can check on our scan via:

```bash
$ kubectl get scans
NAME                                      TYPE                      STATE   FINDINGS
zap-automation-framework-juice-shop       zap-automation-framework   Done    14
```

If the scan's `STATE` is set to done, We can see our findings via the S3 bucket. If you've used the default installation method you can follow the [guide](/docs/getting-started/installation#accessing-the-included-minio-instance) to access the integrated Minio S3 Bucket to view the findings.
And we're done! Have Fun Scanning :)

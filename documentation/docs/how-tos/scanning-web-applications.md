---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Scanning Web Applications"
description: "Automating OWASP ZAP with the secureCodeBox"
sidebar_position: 3
---

## Introduction

In this step-by-step tutorial, we will go through all the required stages to set up an in depth configured ZAP Scan against OWASP Juice Shop with the secureCodeBox.

## Setup

For the sake of the tutorial, we assume that you have your Kubernetes cluster already up and running and that we can work in your default namespace. If not, check out the [installation](/docs/getting-started/installation/) for more information.

We will start by installing the ZAP-Advanced scanner:

```bash
helm upgrade --install zap-advanced secureCodeBox/zap-advanced
```

And the juice-shop demo-target.

```bash
helm upgrade --install juice-shop secureCodeBox/juice-shop
```

## Creating the ZAP-Advanced scan

We can first start with a basic `zap-advanced` scan. We use here our CRD (Custom Resource definition) [Scan](/docs/api/crds/scan) and a [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/) to configure our scan.

```yaml title="scan.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: zap-advanced-scan-config
data:
  2-zap-advanced-scan.yaml: |-

    # ZAP Contexts Configuration 
    contexts:
      # Name to be used to refer to this context in other jobs, mandatory
      - name: scb-juiceshop-context
        # The top level url, mandatory, everything under this will be included
        url: http://juice-shop.default.svc:3000/
---
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "zap-authenticated-full-scan-juiceshop-basic"
  labels:
    organization: "OWASP"
spec:
  scanType: "zap-advanced-scan"
  parameters:
    # target URL including the protocol
    - "-t"
    - "http://juice-shop.default.svc:3000/"
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

We use `volumeMounts` and `volumes` to attach the configMap to our scan in `scan.yaml`. We also set up a context for our `zap-advanced` scan. This is where we can input ZAP related parameters.

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
  name: zap-advanced-scan-config
data:
  2-zap-advanced-scan.yaml: |-

    # ZAP Contexts Configuration 
    contexts:
      # Name to be used to refer to this context in other jobs, mandatory
      - name: scb-juiceshop-context
        # The top level url, mandatory, everything under this will be included
        url: http://juice-shop.default.svc:3000/ 
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
```

ZAP uses a [Spider-Tool](https://www.zaproxy.org/docs/desktop/start/features/spider/) to automatically discover new resources (URLs) on a particular site. We can configure its mode of operation through the parameter `spiders`. A possible configuration can look like this:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: zap-advanced-scan-config
data:
  2-zap-advanced-scan.yaml: |-

    # ZAP Contexts Configuration 
    contexts:
      # Name to be used to refer to this context in other jobs, mandatory
      - name: scb-juiceshop-context
        # The top level url, mandatory, everything under this will be included
        url: http://juice-shop.default.svc:3000/ 
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
    # ZAP Spiders Configuration 
    spiders:
      - name: scb-juiceshop-spider
        # String: Name of the context to spider, default: first context
        context: scb-juiceshop-context
        # String: Name of the user to authenticate with and used to spider
        user: juiceshop-user-1
        # String: Url to start spidering from, default: first context URL
        url: http://juice-shop.default.svc:3000/
        # zapConfiguration.spiders[0].ajax -- Bool: Whether to use the ZAP ajax spider, default: false
        ajax: true
        # Int: Fail if spider finds less than the specified number of URLs, default: 0
        failIfFoundUrlsLessThan: 0
        # Int: Warn if spider finds less than the specified number of URLs, default: 0
        warnIfFoundUrlsLessThan: 0
        # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
        maxDuration: 5
        # Int: The maximum tree depth to explore, default 5
        maxDepth: 10
```

ZAP also has the option for an [Active Scan](https://www.zaproxy.org/docs/desktop/start/features/ascan/).  
Active scanning attempts to find potential vulnerabilities by using known attacks against the selected targets. Its rules can be modified in the `scanners` parameter. An example for that would be:

```yaml
# ZAP ActiveScans Configuration
scanners:
  - name: scb-juiceshop-scan
    # String: Name of the context to attack, default: first context
    context: scb-juiceshop-context
    # String: Name of the user to authenticate with and used to spider
    user: juiceshop-user-1
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

Some URLs may not be reachable without privileged user rights. In this case, it makes sense to provide authentications credentials. This is done through the `authentication`, `users` and `session` parameters in our ConfigMap context. In our case here, we use custom zap scripts to authenticate into juice-shop. The scripts used can be found [here](https://github.com/secureCodeBox/secureCodeBox/tree/main/scanners/zap-advanced/scanner/scripts/).  
:::note
It can be required to configure your own scripts to fit your scan target: more information on how these scripts integrate into ZAP can be found [here](https://www.zaproxy.org/docs/desktop/start/features/scripts/).
:::
Our `contexts` parameter in our scan would then look something like this:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: zap-advanced-scan-config
data:
  2-zap-advanced-scan.yaml: |-

    # ZAP Contexts Configuration 
    contexts:
      # Name to be used to refer to this context in other jobs, mandatory
      - name: scb-juiceshop-context
        # The top level url, mandatory, everything under this will be included
        url: http://juice-shop.default.svc:3000/
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
        # Can be either basicAuth or a oidc token.
        # If both are set, the oidc token takes precedent
        authentication:
          # Currently supports "basic-auth", "form-based", "json-based", "script-based"
          type: "json-based"
          # json-based requires no further configuration
          # zapConfiguration.contexts[0].authentication.json-based -- Configure `type: json-based` authentication (more: https://www.zaproxy.org/docs/api/#json-based-authentication).
          json-based:
            loginUrl: "http://juice-shop.default.svc:3000/rest/user/login"
            # must be escaped already to prevent yaml parser colidations '{"user":{"id":1,"email":"test@test.com"}}''
            loginRequestData: '{"email":"admin@juice-sh.op","password":"admin123"}'
          # Indicates if the current Zap User Session is based on a valid authentication (loggedIn) or not (loggedOut)
          verification:
            # isLoggedInIndicator: "\Q<a href="password.jsp">\E"
            isLoggedOutIndicator: '\Q{"user":{}}\E'
        users:
          - name: juiceshop-user-1
            username: admin@juice-sh.op
            password: admin123
            forced: true
        session:
          # Currently supports "scriptBasedSessionManagement", "cookieBasedSessionManagement", "httpAuthSessionManagement"
          type: "scriptBasedSessionManagement"
          # scriptBasedSessionManagement configuration details
          scriptBasedSessionManagement:
            name: "juiceshop-session-management.js"
            # -- Enables the script if true, otherwise false
            enabled: true
            # Script engine values: 'Graal.js', 'Oracle Nashorn' for Javascript and 'Mozilla Zest' for Zest Scripts
            engine: "Oracle Nashorn"
            # Must be a full path to the script file inside the ZAP container (corresponding to the configMap FileMount)
            filePath: "/home/zap/.ZAP_D/scripts/scripts/session/juiceshop-session-management.js"
            # A short description for the script.
            description: "This is a JuiceShop specific SessionManagement Script used to handle JWT."
```

:::note
For more information on Authentication/Session parameters check out ZAP's documentation on the matter [here](https://www.zaproxy.org/docs/desktop/start/features/authentication/).
:::

Our complete ZAP Scan file is then the following :

```yaml title="scan.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: zap-advanced-scan-config
data:
  2-zap-advanced-scan.yaml: |-

    # ZAP Contexts Configuration 
    contexts:
      # Name to be used to refer to this context in other jobs, mandatory
      - name: scb-juiceshop-context
        # The top level url, mandatory, everything under this will be included
        url: http://juice-shop.default.svc:3000/
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
        # Can be either basicAuth or a oidc token.
        # If both are set, the oidc token takes precedent
        authentication:
          # Currently supports "basic-auth", "form-based", "json-based", "script-based"
          type: "json-based"
          # json-based requires no further configuration
          # zapConfiguration.contexts[0].authentication.json-based -- Configure `type: json-based` authentication (more: https://www.zaproxy.org/docs/api/#json-based-authentication).
          json-based:
            loginUrl: "http://juice-shop.default.svc:3000/rest/user/login"
            # must be escaped already to prevent yaml parser colidations '{"user":{"id":1,"email":"test@test.com"}}''
            loginRequestData: '{"email":"admin@juice-sh.op","password":"admin123"}'
          # Indicates if the current Zap User Session is based on a valid authentication (loggedIn) or not (loggedOut)
          verification:
            # isLoggedInIndicator: "\Q<a href="password.jsp">\E"
            isLoggedOutIndicator: '\Q{"user":{}}\E'
        users:
          - name: juiceshop-user-1
            username: admin@juice-sh.op
            password: admin123
            forced: true
        session:
          # Currently supports "scriptBasedSessionManagement", "cookieBasedSessionManagement", "httpAuthSessionManagement"
          type: "scriptBasedSessionManagement"
          # scriptBasedSessionManagement configuration details
          scriptBasedSessionManagement:
            name: "juiceshop-session-management.js"
            # -- Enables the script if true, otherwise false
            enabled: true
            # Script engine values: 'Graal.js', 'Oracle Nashorn' for Javascript and 'Mozilla Zest' for Zest Scripts
            engine: "Oracle Nashorn"
            # Must be a full path to the script file inside the ZAP container (corresponding to the configMap FileMount)
            filePath: "/home/zap/.ZAP_D/scripts/scripts/session/juiceshop-session-management.js"
            # A short description for the script.
            description: "This is a JuiceShop specific SessionManagement Script used to handle JWT."

    # ZAP Spiders Configuration 
    spiders:
      - name: scb-juiceshop-spider
        # String: Name of the context to spider, default: first context
        context: scb-juiceshop-context
        # String: Name of the user to authenticate with and used to spider
        user: juiceshop-user-1
        # String: Url to start spidering from, default: first context URL
        url: http://juice-shop.default.svc:3000/
        # zapConfiguration.spiders[0].ajax -- Bool: Whether to use the ZAP ajax spider, default: false
        ajax: true
        # Int: Fail if spider finds less than the specified number of URLs, default: 0
        failIfFoundUrlsLessThan: 0
        # Int: Warn if spider finds less than the specified number of URLs, default: 0
        warnIfFoundUrlsLessThan: 0
        # Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
        maxDuration: 5
        # Int: The maximum tree depth to explore, default 5
        maxDepth: 10

    # ZAP ActiveScans Configuration 
    scanners:
      - name: scb-juiceshop-scan
        # String: Name of the context to attack, default: first context
        context: scb-juiceshop-context
        # String: Name of the user to authenticate with and used to spider
        user: juiceshop-user-1
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

---
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "zap-authenticated-full-scan-juiceshop"
  labels:
    organization: "OWASP"
spec:
  scanType: "zap-advanced-scan"
  parameters:
    # target URL including the protocol
    - "-t"
    - "http://juice-shop.default.svc:3000/"
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
NAME                                      TYPE                STATE   FINDINGS
zap-authenticated-full-scan-juiceshop     zap-advanced-scan   Done    14
```

If the scan's `STATE` is set to done, We can see our findings via the S3 bucket. If you've used the default installation method you can follow the [guide](/docs/getting-started/installation#accessing-the-included-minio-instance) to access the integrated Minio S3 Bucket to view the findings.
And we're done! Have Fun Scanning :)

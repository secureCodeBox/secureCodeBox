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

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://www.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

## What is OWASP ZAP?

The [OWASP Zed Attack Proxy (ZAP)][zap owasp project] is one of the world’s most popular free security tools and is actively maintained by hundreds of international volunteers*. It can help you automatically find security vulnerabilities in your web applications while you are developing and testing your applications. It's also a great tool for experienced pentesters to use for manual security testing.

To learn more about the ZAP scanner itself visit [https://www.zaproxy.org/](https://www.zaproxy.org/).

## Deployment
The zap-advanced chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install zap-advanced secureCodeBox/zap-advanced
```

## Scanner Configuration

Listed below are the arguments supported by the `zap-advanced-scan` script.

The command line interface can be used to easily run server scans: `-t www.example.com`

```bash
usage: zap-client [-h] -z ZAP_URL [-a API_KEY] [-c CONFIG_FOLDER] -t TARGET [-o OUTPUT_FOLDER] [-r {XML,XML-plus,JSON,JSON-plus,HTML,HTML-plus,MD}]

OWASP secureCodeBox OWASP ZAP Client  (can be used to automate OWASP ZAP instances based on YAML configuration files.)

optional arguments:
  -h, --help            show this help message and exit
  -z ZAP_URL, --zap-url ZAP_URL
                        The ZAP API Url used to call the ZAP API.
  -a API_KEY, --api-key API_KEY
                        The ZAP API Key used to call the ZAP API.
  -c CONFIG_FOLDER, --config-folder CONFIG_FOLDER
                        The path to a local folder containing the additional ZAP configuration YAMLs used to configure OWASP ZAP.
  -t TARGET, --target TARGET
                        The target to scan with OWASP ZAP.
  -o OUTPUT_FOLDER, --output-folder OUTPUT_FOLDER
                        The path to a local folder used to store the output files, eg. the ZAP Report or logfiles.
  -r {XML,XML-plus,JSON,JSON-plus,HTML,HTML-plus,MD}, --report-type {XML,XML-plus,JSON,JSON-plus,HTML,HTML-plus,MD}
                        The OWASP ZAP Report Type.
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations

By default, the secureCodeBox ZAP Helm Chart installs the scanType `zap-advanced-scan` along with a minimal _default configuration_ based on the HelmChart value `zapConfiguration`. The configuration will be stored in a dedicate scanType specific _configMap_ named `zap-advanced-scantype-config`. Feel free to use the `configMap` or even the HelmChart values to adjust the  advanced ZAP configuration settings according to your needs. Details about the different configuration options can be found below.

Additionally, there will be some ZAP Scripts included, these are stored in the corresponding configMaps `zap-scripts-authentication` and `zap-scripts-session`. Scripts can be used to implement a specific behavior or even new authentication patterns, which are not supported by ZAP out of the box. Feel free to add additional scripts in your own, if you need them.

```bash
                                                                                            ┌────────────────────────────────────────┐
┌──────────────────────────────────────┐                                                    │A YAML configuration file for ZAP that  │
│This CM contains ZAP authentication   │                                                    │relates to the scanType directly.       │
│scripts that are already included     │                                                    │- will be used for all scans by default │
│within the zap-advanced scanner.      │                                                    │- can be configured via Helm Values:    │
│Feel free to add your own.            │────────┐     ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   ┌───────│  zapConfiguration                      │
│                                      │        │                                   │       │- add your baseline config here         │
│ConfigMap: zap-scripts-authentication │        │     │  ┌───────────────────┐  │   │       │                                        │
└──────────────────────────────────────┘        │        │                   │      │       │ConfigMap: zap-advanced-scantype-config │
                                                │     │  │  ZAP Client       │  │   │       └────────────────────────────────────────┘
               All scripts are mounted as files │        │  Python3 Module   │◀─────┤                                                
        directly into the ZAP container. To use │     │  │                   │  │   │  All referenced YAML files will be merged into 
        them add a corresponding script section │        └───────────────────┘      │  one single YAML configuration. The merged one 
                           in your config YAML. │     │            │            │   │  will be used to configure the ZAP instance.   
                                                │              uses API             │                                                
┌──────────────────────────────────────┐        │     │            │            │   │       ┌────────────────────────────────────────┐
│This CM contains ZAP session          │        │                  ▼                │       │A YAML configuration for ZAP that       │
│scripts that are already included     │        │     │  ┌───────────────────┐  │   │       │relates to a single scan execution.     │
│within the zap-advanced scanner.      │        │        │                   │      │       │- can by used for selected scans        │
│Feel free to add your own.            │────────┼─────┼─▶│  OWASP ZAP Proxy  │  │   │       │- not created by default                │
│                                      │        │        │                   │      └───────│- add your scan target specific config  │
│ConfigMap: zap-scripts-session        │        │     │  └───────────────────┘  │           │- needs to be referenced in Scan        │
└──────────────────────────────────────┘        │                                           │- please use SecretMap for credentials! │
┌──────────────────────────────────────┐        │     │  secureCodeBox scanner  │           │                                        │
│Feel free to add your own scripts :)  │        │        scanType: zap-advanced             │ConfigMap: zap-advanced-scan-config     │
│                                      │────────┘     └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘           └────────────────────────────────────────┘
│ConfigMap: zap-scripts-your-name      │                                                                                             
└──────────────────────────────────────┘                                                                                             

```

The following picture outlines the reference concept of the ZAP YAML configuration `zapConfiguration`. If you want to configure an `api` scan, `spider` or active `scan` you must at least add one `context` item with a `name` and `url` configured. The context `url` must match the target url used in the `Scan` execution:

```yaml
spec:
  scanType: "zap-advanced-scan"
  parameters:
    # target URL must match with `context.url` to identify the corresponding configurations.
    - "-t"
    - "http://bodgeit.default.svc:8080/bodgeit/"
```

If you want to configure the `api` scan, `spider` or active `scan` section it is mandatory to add the `context: ` reference the section. Otherwise it is not possible to identify which configuration must be used for a scan. The `url` in the `api` , `spider` or active 'scan` section can be different to the context.url (and scan target url).

```bash
┌────────────────────────────────────────────────────────────────┐
│      ZAP Configuration YAML - reference by "context name"      │
└────────────────────────────────────────────────────────────────┘
                                                                                                                      
┌────────────────┐            ┌────────────────┐                 
│ Context        │            │ Context        │                 
│  - name:  ABC  │◀───┬─┬─┐   │  - name:  XYZ  │◀───┬─┬─┐        
│    url:   ...  │    │ │ │   │    url:   ...  │    │ │ │        
└────────────────┘    │ │ │   └────────────────┘    │ │ │        
 ┌─────────────────┐  │ │ │    ┌─────────────────┐  │ │ │        
 │ API:            │  │ │ │    │ API:            │  │ │ │        
 │  - context: ABC │──┘ │ │    │  - context: XYZ │──┘ │ │        
 │  - ...          │    │ │    │  - ...          │    │ │        
 └─────────────────┘    │ │    └─────────────────┘    │ │        
   ┌─────────────────┐  │ │      ┌─────────────────┐  │ │        
   │ Spider:         │  │ │      │ Spider:         │  │ │        
   │  - context: ABC │──┘ │      │  - context: XYZ │──┘ │        
   │  - ...          │    │      │  - ...          │    │        
   └─────────────────┘    │      └─────────────────┘    │        
     ┌─────────────────┐  │        ┌─────────────────┐  │        
     │ Scanner:        │  │        │ Scanner:        │  │        
     │  - context: ABC │──┘        │  - context: XYZ │──┘        
     │  - ...          │           │  - ...          │           
     └─────────────────┘           └─────────────────┘           

```

## ZAP Configuration
The following YAMl gives you an overview about all the different configuration options you have to configure the ZAP advanced scan. Please have a look into our `./examples/...` to find some working examples. We provide a list of working examples to scan our `demo-targets` with the `zap-advanced-scan`.

:::note

The YAML format is based on the new [ZAP Automation Framework](https://www.zaproxy.org/docs/desktop/addons/automation-framework/) but not exactly the same. The ZAP Automation Framework is a new approach of the ZAP Team to ease up the automation possibilities of the ZAP scanner itself. Since this ZAP Automation Framework is not ready yet we are not using it for now. We track the progress in this [issue #321](https://github.com/secureCodeBox/secureCodeBox/issues/321) for the future.

The ZAP Automation format represents a more "imperative" semantic, due to the fact that you have to configure sequences of "jobs" containing the steps to configure and automate ZAP. In contrast to that has the secureCodeBox `zap-advanced` YAML format `zapConfiguration` a  "declarative" semantic. The similarity of both YAML formats can help to migrate to the ZAP Automation Framework.

:::

```yaml
zapConfiguration:
  # -- Optional general ZAP Configurations settings.
  global:
    # -- The ZAP internal Session name. Default: secureCodeBox
    sessionName: secureCodeBox
    # -- Updates all installed ZAP AddOns on startup if true, otherwise false.
    addonUpdate: true
    # -- Installs additional ZAP AddOns on startup, listed by their name:
    addonInstall:
      - pscanrulesBeta
      - ascanrulesBeta
      - pscanrulesAlpha
      - ascanrulesAlpha
    # -- An optional list of global regexes to include
    includePaths:
      - "https://example.com/.*"
    # -- An optional list of global regexes to exclude
    excludePaths:
      # - "https://example.com/authserver/v1/.*"
      - ".*\\.js"
      - ".*\\.css"
      - ".*\\.png"
      - ".*\\.jpeg"
    # -- Configures a proxy for ZAP to tunnel the traffic somewhere else
    proxy:
      # -- Define if an outgoing proxy server is used.
      enabled: false
      # -- The proxy port to use
      port: 8080
      # -- MANDATORY only if useProxyChain is True, ignored otherwise. Outgoing proxy address and port
      address: my.corp.proxy
      # -- Define the addresses to skip in case useProxyChain is True. Ignored otherwise. List can be empty.
      skipProxyAddresses:
        - "127.0.0.1"
        - localhost
      # -- MANDATORY only if proxy.enabled is True. Ignored otherwise. Define if proxy server needs authentication
      authentication:
          enabled: false
          proxyUsername: ""
          proxyPassword: ""
          proxyRealm: ""
    # -- Configures existings ZAP Scripts or add new ZAP Scripts. For example can be used if a proxy script must be loaded. Proxy scripts are executed for every request traversing ZAP
    scripts:
      - name: "Alert_on_HTTP_Response_Code_Errors.js"
        # -- True if the script must be enabled, false otherwise
        enabled: false
        # -- The complete filepath (inside the ZAP Container!) to the script file.
        filePath: "/home/zap/.ZAP_D/scripts/scripts/httpsender/Alert_on_HTTP_Response_Code_Errors.js"
        # -- The script engine. Possible values are: 'Graal.js', 'Oracle Nashorn' for Javascript and 'Mozilla Zest' for Zest Scripts
        engine: "Oracle Nashorn"
        # -- The type of script engine used. Possible values are: 'httpsender', 'authentication', 'session', 'proxy', ...
        type: "httpsender"
        # -- A short description for the script.
        description: "A HTTP Sender Script which will raise alerts based on HTTP Response codes."
      - name: "Alert_on_Unexpected_Content_Types.js"
        # -- True if the script must be enabled, false otherwise
        enabled: false
        # -- The complete filepath (inside the ZAP Container!) to the script file.
        filePath: "/home/zap/.ZAP_D/scripts/scripts/httpsender/Alert_on_Unexpected_Content_Types.js"
        # -- The type of script engine used. Possible values are: 'Graal.js', 'Oracle Nashorn' for Javascript and 'Mozilla Zest' for Zest Scripts
        engine: "Oracle Nashorn"
        # -- The type of the script. Possible values are: 'httpsender', 'authentication', 'session', 'proxy', ...
        type: "httpsender"
        # -- A short description for the script.
        description: "A HTTP Sender Script which will raise alerts based on unexpected Content-Types."

  # -- Optional list of ZAP Context definitions
  contexts:
    # -- Name to be used to refer to this context in other jobs, mandatory
    - name: scbcontext
      # -- The top level URL
      url: https://example.com/
      # -- An optional list of regexes to include in the ZAP context
      includePaths:
        - "https://example.com/.*"
      #  -- An optional list of regexes to exclude in the ZAP context
      excludePaths:
        # - "https://example.com/authserver/v1/.*"
        - ".*\\.js"
        - ".*\\.css"
        - ".*\\.png"
        - ".*\\.jpeg"
      # -- Optional technology list
      technology:
        # -- By default all technologies are enabed for each context by ZAP. You can use the following config to change that explicitly.
        included:
          - Db.CouchDB
          - Db.Firebird
          - Db.HypersonicSQL
          - Language.ASP
          - OS
        # -- By default all technologies are enabed for each context by ZAP. You can use the following config to change that explicitly.
        excluded:
         - SCM
      # -- Authentication Configuration that can be uses by ZAP Spider and/or Scanner. You need to reference the `context` name in the corresponding `zapConfiguration.spiders[0].context` and `zapConfiguration.scanners[0].context` section if you want to use them.
      authentication:
        # -- Currently supports "basic-auth", "form-based", "json-based", "script-based"
        type: "script-based"
        # -- Optional, only mandatory if zapConfiguration.contexts[0].authentication.type: "script-based". More ZAP details about 'script based' authentication can be found here: https://www.zaproxy.org/docs/api/#script-based-authentication.
        script-based:
          # -- The name of the authentication script
          name: scb-oidc-password-grand-type.js
          # -- Enables the script if true, otherwise false
          enabled: true
          # -- The type of script engine used. Possible values are: 'Graal.js', 'Oracle Nashorn' for Javascript and 'Mozilla Zest' for Zest Scripts
          engine: "Oracle Nashorn"
          # -- Must be a full path to the script file inside the ZAP container (corresponding to the configMap FileMount)
          filePath: "/home/zap/.ZAP_D/scripts/scripts/authentication/scb-oidc-password-grand-type.js"
          # -- A short description for the script.
          description: "This is a description for the SCB OIDC Script."
          # -- Optional list of all script arguments needed to be passed to the script.
          arguments:
            sub: "secureCodeBox@iteratec.com"
            email: "secureCodeBox@teratec.com"
            exp: "1609459140"
        # -- Optional, only mandatory if zapConfiguration.contexts[0].authentication.type: "basic-auth". More ZAP details about 'basic auth' based authentication can be found here: https://www.zaproxy.org/docs/api/?python#general-steps.
        basic-auth:
          # -- The hostname that must be for the basic authentication
          hostname: "https://example.com/"
          # -- The realm that must be for the basic authentication
          realm: "Realm"
          # -- The port that must be for the basic authentication
          port: 8080
        # -- Optional, only mandatory if zapConfiguration.contexts[0].authentication.type: "form-based". More ZAP details about 'form-based' based authentication can be found here: https://www.zaproxy.org/docs/api/#form-based-authentication.
        form-based:
          # -- The URL to the login form that must be used
          loginUrl: "http://localhost:8090/bodgeit/login.jsp"
          # -- The mapping of username and password to HTTP post parameters. Hint: the value must be escaped already to prevent YAML parser colidations. Example the intended value 'username={%username%}&password={%password%}' must be ''username%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D.
          loginRequestData: "username%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D"
        # -- Optional, only mandatory if zapConfiguration.contexts[0].authentication.type: "json-based". More ZAP details about 'json-based' based authentication can be found here: https://www.zaproxy.org/docs/api/#json-based-authentication.
        json-based:
          loginUrl: "http://localhost:3000/rest/user/login"
          # must be escaped already to prevent yaml parser colidations '{"user":{"id":1,"email":"test@test.com"}}''
          loginRequestData: '{"user":{"id":1,"email":"test@test.com"}}'
        # -- Indicates if the current Zap User Session is based on a valid authentication (loggedIn) or not (loggedOut)
        verification:
          # -- The optional ZAP indiator string for loggedIn Users
          isLoggedInIndicator: ""
          # -- The optional ZAP indiator string for loggedOut Users
          isLoggedOutIndicator: ""
      # -- A list of users with credentials which can be referenced by spider or scanner configurations to run them authenticated (you have to configure the authentiation settings). Hint: you can use secretMaps to seperate credentails.
      users:
        # -- The name of this user configuration
        - name: test-user-1
          # -- The username used to authenticate this user
          username: user1
          # -- The password used to authenticate this user
          password: password1
          # -- Optional, could be set to True only once in the users list. If not defined the first user in the list will be forced by default.
          forced: true
        # -- The name of this user configuration
        - name: test-user-2
          # -- The username used to authenticate this user
          username: user2
          # -- The password used to authenticate this user
          password: password2
      # -- The optional ZAP session configuration
      session:
        # -- The ZAP Session type indicates how Zap identifies sessions. Currently supports the following types: "scriptBasedSessionManagement", "cookieBasedSessionManagement", "httpAuthSessionManagement"
        type: "scriptBasedSessionManagement"
        # -- Optional, only mandatory if zapConfiguration.contexts[0].session.type: "scriptBasedSessionManagement". Additional configrations for the session type "scriptBasedSessionManagement"
        scriptBasedSessionManagement:
          # -- The name of the session script to be used.
          name: "juiceshop-session-management.js"
          # -- Enables the script if true, otherwise false
          enabled: true
          # -- The type of script engine used. Possible values are: 'Graal.js', 'Oracle Nashorn' for Javascript and 'Mozilla Zest' for Zest Scripts
          engine: "Oracle Nashorn"
          # --  Must be a full path to the script file inside the ZAP container (corresponding to the configMap FileMount)
          fileName: "/home/zap/.ZAP_D/scripts/scripts/session/juiceshop-session-management.js"
          # --  An optional description used for the script.
          description: "This is a JuiceShop specific SessionManagement Script used to handle JWT."
 
  # -- Optional list of ZAP OpenAPI configurations
  apis:
    # -- The name of the api configuration
    - name: scb-petstore-api
      # -- The Name of the context (zapConfiguration.contexts[x].name) to reference, default: the first context available
      context: scb-petstore-context
      # -- The used format of the API. Possible values are: 'openapi', 'grapql', 'soap'
      format: openapi
      # -- Url to start importing the API from, default: first context URL
      url: http://localhost:8000/v2/swagger.json
      # -- Optional: Override host setting in the API (e.g. swagger.json) if your API is using some kind of internal routing.
      hostOverride: http://localhost:8000
      # -- Optional: Assumes that the API Spec has been saved to a configmap in the namespace of the scan / this release. Should be null if not used.
      configMap:
        # Object with two keys: "name" name of the config map, and "key" which is the key / property in the configmap which holds the openapi spec file.
        name: my-configmap-with-openapi-spec
        key: openapi.yaml
      # -- Allows to embed the entire yaml / json API spec in the values (e.g. OpenAPI YAML spec). Should be null if not used.
      spec: null
      # -- Configures existings ZAP Scripts or add new ZAP Scripts. For example can be used if a proxy script must be loaded. Proxy scripts are executed for every request traversing ZAP
      scripts:
        - name: "Alert_on_HTTP_Response_Code_Errors.js"
          # -- True if the script must be enabled, false otherwise
          enabled: true
        - name: "Alert_on_Unexpected_Content_Types.js"
          # -- True if the script must be enabled, false otherwise
          enabled: true

  # -- Optional list of ZAP Spider configurations
  spiders:
      # -- String: The name of the spider configuration
    - name: scbspider
      # -- String: The Name of the context (zapConfiguration.contexts[x].name) to spider, default: first context available
      context: scbcontext
      # -- String: The Name of the user (zapConfiguration.contexts[0].users[0].name) used to authenticate the spider with
      user: "test-user-1"
      # -- String: Url to start spidering from, default: first context URL
      url: https://example.com/
      # -- Bool: Whether to use the ZAP ajax spider, default: false
      ajax: false
      # -- Int: Fail if spider finds less than the specified number of URLs, default: 0
      failIfFoundUrlsLessThan: 0
      # -- Int: Warn if spider finds less than the specified number of URLs, default: 0
      warnIfFoundUrlsLessThan: 0
      # -- Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited
      maxDuration: 0
      # -- Int: The maximum tree depth to explore, default 5
      maxDepth: 5
      # -- Int: The maximum number of children to add to each node in the tree                    
      maxChildren: 10
      # -- Bool: Whether the spider will accept cookies, default: true
      acceptCookies: true
      # -- Bool: Whether the spider will handle OData responses, default: false
      handleODataParametersVisited: false
      # -- Enum [ignore_completely, ignore_value, use_all]: How query string parameters are used when checking if a URI has already been visited, default: use_all
      handleParameters: use_all
      # -- Int: The max size of a response that will be parsed, default: 2621440 - 2.5 Mb
      maxParseSizeBytes: 2621440
      # -- Bool: Whether the spider will parse HTML comments in order to find URLs, default: true
      parseComments: true
      # Bool: Whether the spider will parse Git metadata in order to find URLs, default: false
      parseGit: false
      # -- Bool: Whether the spider will parse 'robots.txt' files in order to find URLs, default: true
      parseRobotsTxt: true
      # -- Bool: Whether the spider will parse 'sitemap.xml' files in order to find URLs, default: true
      parseSitemapXml: true
      # -- Bool: Whether the spider will parse SVN metadata in order to find URLs, default: false
      parseSVNEntries: false
      # -- Bool: Whether the spider will submit POST forms, default: true
      postForm: true
      # -- Bool: Whether the spider will process forms, default: true
      processForm: true
      # -- Int: The time between the requests sent to a server in milliseconds, default: 200
      requestWaitTime: 200
      # -- Bool: Whether the spider will send the referer header, default: true
      sendRefererHeader: true
      # -- Int: The number of spider threads, default: 2            
      threadCount: 2
      # -- String: The user agent to use in requests, default: '' - use the default ZAP one              
      userAgent: "secureCodeBox / ZAP Spider"
      # -- Configures existings ZAP Scripts or add new ZAP Scripts. For example can be used if a proxy script must be loaded. Proxy scripts are executed for every request traversing ZAP
      scripts: {}
 
  # -- Optional list of ZAP Active Scanner configurations
  scanners:
      # -- String: Name of the context to attack, default: first context
    - name: scbscan
      # -- String: Name of the context to attack, default: first context
      context: scbcontext
      # -- String: Url to start scaning from, default: first context URL
      url: https://example.com/
      # -- String: The name of the default scan policy to use, default: Default Policy
      defaultPolicy: "Default Policy"
      # -- String: Name of the scan policy to be used, default: Default Policy
      policy: "Default Policy"
      # -- Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited
      maxRuleDurationInMins: 0
      # -- Int: The max time in minutes the active scanner will be allowed to run for, default: 0 unlimited         
      maxScanDurationInMins: 0
      # -- Int: The delay in milliseconds between each request, use to reduce the strain on the target, default 0
      delayInMs: 0
      # -- Bool: If set will add an extra query parameter to requests that do not have one, default: false
      addQueryParam: false
      # -- Bool: If set then automatically handle anti CSRF tokens, default: false
      handleAntiCSRFTokens: false
      # -- Bool: If set then the relevant rule Id will be injected into the X-ZAP-Scan-ID header of each request, default: false          
      injectPluginIdInHeader: false
      # -- Bool: If set then the headers of requests that do not include any parameters will be scanned, default: false
      scanHeadersAllRequests: false
      # -- Int: The max number of threads per host, default: 2
      threadPerHost: 2
      # -- The policy definition, only used if the 'policy' is not set - NOT YET IMPLEMENTED
      policyDefinition:
        # -- String: The default Attack Strength for all rules, one of Low, Medium, High, Insane (not recommended), default: Medium
        defaultStrength: Medium
        # -- String: The default Alert Threshold for all rules, one of Off, Low, Medium, High, default: Medium
        defaultThreshold: Medium
        # -- A list of one or more active scan rules and associated settings which override the defaults
        rules:
          # -- Int: The rule id as per https://www.zaproxy.org/docs/alerts/
        - id: 10106
          # -- The name of the rule for documentation purposes - this is not required or actually used
          name: "rule"
          # -- String: The Attack Strength for this rule, one of Low, Medium, High, Insane, default: Medium
          strength: Medium
          # -- String: The Alert Threshold for this rule, one of Off, Low, Medium, High, default: Medium
          threshold: Low
      # -- Configures existings ZAP Scripts or add new ZAP Scripts. For example can be used if a proxy script must be loaded. Proxy scripts are executed for every request traversing ZAP
      scripts: {}
```

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `false` | Enables or disables the installation of the default cascading rules for this scanner |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| parser.affinity | object | `{}` | Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| parser.env | list | `[]` | Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| parser.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parser.image.repository | string | `"docker.io/securecodebox/parser-zap"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.resources | object | { requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } } | Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| parser.scopeLimiterAliases | object | `{}` | Optional finding aliases to be used in the scopeLimiter. |
| parser.tolerations | list | `[]` | Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.activeDeadlineSeconds | string | `nil` | There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup) |
| scanner.affinity | object | `{}` | Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.envFrom | list | `[]` | Optional mount environment variables from configMaps or secrets (see: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#configure-all-key-value-pairs-in-a-secret-as-container-environment-variables) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[{"mountPath":"/home/securecodebox/configs/1-zap-advanced-scantype.yaml","name":"zap-advanced-scantype-config","readOnly":true,"subPath":"1-zap-advanced-scantype.yaml"}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[{"configMap":{"name":"zap-advanced-scantype-config","optional":true},"name":"zap-advanced-scantype-config"},{"configMap":{"name":"zap-scripts-authentication"},"name":"zap-scripts-authentication"},{"configMap":{"name":"zap-scripts-session"},"name":"zap-scripts-session"}]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| scanner.image.repository | string | `"docker.io/securecodebox/scanner-zap-advanced"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts version |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.podSecurityContext | object | `{}` | Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":false,"runAsNonRoot":false}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scanner.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scanner.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scanner.securityContext.readOnlyRootFilesystem | bool | `false` | Prevents write access to the containers file system |
| scanner.securityContext.runAsNonRoot | bool | `false` | Enforces that the scanner image is run as a non root user |
| scanner.tolerations | list | `[]` | Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| zapConfiguration | object | `{}` | All `scanType` specific configuration options. Feel free to add more configuration options. All configuration options can be overridden by scan specific configurations if defined. Please have a look into the README.md to find more configuration options. |
| zapContainer.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| zapContainer.envFrom | list | `[]` | Optional mount environment variables from configMaps or secrets (see: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#configure-all-key-value-pairs-in-a-secret-as-container-environment-variables) |
| zapContainer.extraVolumeMounts | list | `[{"mountPath":"/home/zap/.ZAP_D/scripts/scripts/authentication/","name":"zap-scripts-authentication","readOnly":true},{"mountPath":"/home/zap/.ZAP_D/scripts/scripts/session/","name":"zap-scripts-session","readOnly":true}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| zapContainer.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| zapContainer.image.repository | string | `"owasp/zap2docker-stable"` | Container Image to run the scan |
| zapContainer.image.tag | string | `nil` | defaults to the charts appVersion |
| zapContainer.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| zapContainer.securityContext.allowPrivilegeEscalation | bool | `false` |  |
| zapContainer.securityContext.capabilities.drop[0] | string | `"all"` |  |
| zapContainer.securityContext.privileged | bool | `false` |  |
| zapContainer.securityContext.readOnlyRootFilesystem | bool | `false` |  |
| zapContainer.securityContext.runAsNonRoot | bool | `false` |  |

## Contributing

Contributions are welcome and extremely helpful 🙌
Please have a look at [Contributing](./CONTRIBUTING.md)

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

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
[zap owasp project]: https://owasp.org/www-project-zap/
[zap github]: https://github.com/zaproxy/zaproxy/
[zap user guide]: https://www.zaproxy.org/docs/

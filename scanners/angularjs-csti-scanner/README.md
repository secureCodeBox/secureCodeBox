

---
title: "Angularjs CSTI Scanner"
category: "scanner"
type: "Repository"
state: "in progress"
usecase: "Find AngularJS websites vulnerable to template injections"
---

![acstis logo](https://rawgit.com/tijme/angularjs-csti-scanner/master/.github/logo.svg?pypi=png.from.svg)

AngularJS Client-Side Template Injection Scanner (acstis) is an open source scanner for
finding possible template injection vulnerabilities on websites using AngularJS.

For more information visit the projects GitHub site <https://github.com/tijme/angularjs-csti-scanner>

## Deployment

The acstis scanner can be deployed with helm:

```bash
helm upgrade --install acstis secureCodeBox/acstis
```

## Scanner configuration

The only mandatory parameter is:
- `-d`: The url to scan (e.g. https://angularjs.org/).

Optional arguments:

```bash
-c, --crawl                                                                      use the crawler to scan all the entire domain
-vp, --verify-payload                                                            use a javascript engine to verify if the payload was executed (otherwise false positives may occur)
-av ANGULAR_VERSION, --angular-version ANGULAR_VERSION                           manually pass the angular version (e.g. 1.4.2) if the automatic check doesn't work
-vrl VULNERABLE_REQUESTS_LOG, --vulnerable-requests-log VULNERABLE_REQUESTS_LOG  log all vulnerable requests to this file (e.g. /var/logs/acstis.log or urls.log)
-siv, --stop-if-vulnerable                                                       (crawler option) stop scanning if a vulnerability was found
-pmm, --protocol-must-match                                                      (crawler option) only scan pages with the same protocol as the starting point (e.g. only https)
-sos, --scan-other-subdomains                                                    (crawler option) also scan pages that have another subdomain than the starting point
-soh, --scan-other-hostnames                                                     (crawler option) also scan pages that have another hostname than the starting point
-sot, --scan-other-tlds                                                          (crawler option) also scan pages that have another tld than the starting point
-md MAX_DEPTH, --max-depth MAX_DEPTH                                             (crawler option) the maximum search depth (default is unlimited)
-mt MAX_THREADS, --max-threads MAX_THREADS                                       (crawler option) the maximum amount of simultaneous threads to use (default is 20)
-iic, --ignore-invalid-certificates                                              (crawler option) ignore invalid ssl certificates
```

**Do not** override the option `-vrl` or `--vulnerable-requests-log`. It is already configured for automatic findings parsing.

### Request configuration

Because *acstis* does not provide command line arguments for configuring the sent requests,
you have to mount a config map into the scan container on a specific location. Your additional config map should be
 mounted to `/acstis/config/acstis-config.py`. For example create a config map:

 ```bash
kubectl create configmap --from-file /path/to/my/acstis-config.py acstis-config
```

Then, mount it into the container:

```yaml
 volumes:
     - name: "acstis-config"
       configMap:
         name: "acstis-config"
   volumeMounts:
     - name: "acstis-config"
       mountPath: "/acstis/config/"
```

#### Configuration options in *acstis-config.py*

Add the following snippets to the *acstis-config.py* file to enable further options.
The options are python code which will be injected into the *acstis* script before execution.

**Basic Authentication**
```text
options.identity.auth = HTTPBasicAuth("username", "password")
```

**Cookies**
```text
options.identity.cookies.set(name='tasty_cookie', value='yum', domain='finnwea.com', path='/cookies')
options.identity.cookies.set(name='gross_cookie', value='blech', domain='finnwea.com', path='/elsewhere')
```

**Headers**
```text
options.identity.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
    "Authorization": "Bearer ey3jafoe.2jefo..."
})
```

**Proxies**
```text
options.identity.proxies = {
    # No authentication
    # 'http': 'http://host:port',
    # 'https': 'http://host:port',

    # Basic authentication
    # 'http': 'http://user:pass@host:port',
    # 'https': 'https://user:pass@host:port',

    # SOCKS
    'http': 'socks5://user:pass@host:port',
    'https': 'socks5://user:pass@host:port'
}
```

**Scope options**
```text
options.scope.protocol_must_match = False

options.scope.subdomain_must_match = True

options.scope.hostname_must_match = True

options.scope.tld_must_match = True

options.scope.max_depth = None

options.scope.request_methods = [
    Request.METHOD_GET,
    Request.METHOD_POST,
    Request.METHOD_PUT,
    Request.METHOD_DELETE,
    Request.METHOD_OPTIONS,
    Request.METHOD_HEAD
]
```

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.repository | string | `"docker.io/securecodebox/scanner-angularjs-csti-scanner"` | Container Image to run the scan |
| image.tag | string | `nil` | defaults to the charts version |
| parseJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| parserImage.repository | string | `"docker.io/securecodebox/parser-angularjs-csti-scanner"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

---
title: "Nikto"
category: "scanner"
type: "Webserver"
state: "released"
appVersion: "2.1.6"
usecase: "Webserver Vulnerability Scanner"
---

![nikto logo](https://cirt.net/files/alienlogo_3.gif)

Nikto is a free software command-line vulnerability scanner that scans webservers for dangerous files/CGIs, outdated server software and other problems. It performs generic and server type specific checks. It also captures and prints any cookies received. To learn more about the Nikto scanner itself visit [cirt.net] or [Nikto GitHub].

<!-- end -->

## Deployment

The Nikto ScanType can be deployed via helm:

```bash
helm upgrade --install nikto secureCodeBox/nikto
```

## Scanner Configuration

The following security scan configuration example are based on the [Nikto Documentation](https://cirt.net/nikto2-docs/usage.html#id2780332), please take a look at the original documentation for more configuration examples.

* The most basic Nikto scan requires simply a host to target, since port 80 is assumed if none is specified. The host can either be an IP or a hostname of a machine, and is specified using the -h (-host) option. This will scan the IP 192.168.0.1 on TCP port 80: `-h 192.168.0.1`
* To check on a different port, specify the port number with the -p (-port) option. This will scan the IP 192.168.0.1 on TCP port 443: `-h 192.168.0.1 -p 443`
* Hosts, ports and protocols may also be specified by using a full URL syntax, and it will be scanned: `-h https://192.168.0.1:443/`
* Nikto can scan multiple ports in the same scanning session. To test more than one port on the same host, specify the list of ports in the -p (-port) option. Ports can be specified as a range (i.e., 80-90), or as a comma-delimited list, (i.e., 80,88,90). This will scan the host on ports 80, 88 and 443: `-h 192.168.0.1 -p 80,88,443`

Nikto also has a comprehensive list of [command line options documented](https://cirt.net/nikto2-docs/options.html) which maybe useful to use.

* Scan tuning can be used to decrease the number of tests performed against a target. By specifying the type of test to include or exclude, faster, focused testing can be completed. This is useful in situations where the presence of certain file types are undesired -- such as XSS or simply "interesting" files. Test types can be controlled at an individual level by specifying their identifier to the -T (-Tuning) option. In the default mode, if -T is invoked only the test type(s) specified will be executed. For example, only the tests for "Remote file retrieval" and "Command execution" can performed against the target: `192.168.0.1 -T 58`
  * 0 - File Upload. Exploits which allow a file to be uploaded to the target server.
  * 1 - Interesting File / Seen in logs. An unknown but suspicious file or attack that has been seen in web server logs (note: if you have information regarding any of these attacks, please contact CIRT, Inc.).
  * 2 - Misconfiguration / Default File. Default files or files which have been misconfigured in some manner. This could be documentation, or a resource which should be password protected.
  * 3 - Information Disclosure. A resource which reveals information about the target. This could be a file system path or account name.
  * 4 - Injection (XSS/Script/HTML). Any manner of injection, including cross site scripting (XSS) or content (HTML). This does not include command injection.
  * 5 - Remote File Retrieval - Inside Web Root. Resource allows remote users to retrieve unauthorized files from within the web server's root directory.
  * 6 - Denial of Service. Resource allows a denial of service against the target application, web server or host (note: no intentional DoS attacks are attempted).
  * 7 - Remote File Retrieval - Server Wide. Resource allows remote users to retrieve unauthorized files from anywhere on the target.
  * 8 - Command Execution / Remote Shell. Resource allows the user to execute a system command or spawn a remote shell.
  * 9 - SQL Injection. Any type of attack which allows SQL to be executed against a database.
  * a - Authentication Bypass. Allows client to access a resource it should not be allowed to access.
  * b - Software Identification. Installed software or program could be positively identified.
  * c - Remote source inclusion. Software allows remote inclusion of source code.
  * x - Reverse Tuning Options. Perform exclusion of the specified tuning type instead of inclusion of the specified tuning type

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.repository | string | `"securecodebox/scannner-nikto"` | Container Image to run the scan |
| image.tag | string | `nil` | defaults to the charts appVersion |
| parserImage.repository | string | `"docker.io/securecodebox/parser-nikto"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | Defines how long the scanner job after finishing will be available (see: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/) |

[cirt.net]: https://cirt.net/
[nikto github]: https://github.com/sullo/nikto

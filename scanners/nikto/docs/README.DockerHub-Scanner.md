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

### Quickstart with secureCodeBox on Kubernetes

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

## Supported Tags
- `latest`  (represents the latest stable release build)
- tagged releases, e.g. `2.1.6`

## How to use this image
This `scanner` image is intended to work in combination with the corresponding `parser` image to parse the scanner `findings` to generic secureCodeBox results. For more information details please take a look at the [project page][scb-docs] or [documentation page][https://www.securecodebox.io/docs/scanners/Nikto].

```bash
docker pull securecodebox/scanner-nikto
```

## What is Nikto?
Nikto is a free software command-line vulnerability scanner that scans webservers for dangerous files/CGIs, outdated server software and other problems. It performs generic and server type specific checks. It also captures and prints any cookies received. To learn more about the Nikto scanner itself visit [cirt.net] or [Nikto GitHub].

## Scanner Configuration

The following security scan configuration example are based on the [Nikto Documentation](https://cirt.net/nikto2-docs/usage.html#id2780332), please take a look at the original documentation for more configuration examples.

* The most basic Nikto scan requires simply a host to target, since port 80 is assumed if none is specified. The host can either be an IP or a hostname of a machine, and is specified using the -h (-host) option. This will scan the IP 192.168.0.1 on TCP port 80: `-h 192.168.0.1`
* To check on a different port, specify the port number with the -p (-port) option. This will scan the IP 192.168.0.1 on TCP port 443: `-h 192.168.0.1 -p 443`
* Hosts, ports and protocols may also be specified by using a full URL syntax, and it will be scanned: `-h https://192.168.0.1:443/`
* Nikto can scan multiple ports in the same scanning session. To test more than one port on the same host, specify the list of ports in the -p (-port) option. Ports can be specified as a range (i.e., 80-90), or as a comma-delimited list, (i.e., 80,88,90). This will scan the host on ports 80, 88 and 443: `-h 192.168.0.1 -p 80,88,443`

Nikto also has a comprehensive list of [command line options documented](https://cirt.net/nikto2-docs/options.html) which maybe useful to use.

* Scan tuning can be used to decrease the number of tests performed against a target. By specifying the type of test to include or exclude, faster, focused testing can be completed. This is useful in situations where the presence of certain file types are undesired -- such as XSS or simply "interesting" files. Test types can be controlled at an individual level by specifying their identifier to the -T (-Tuning) option. In the default mode, if -T is invoked only the test type(s) specified will be executed. For example, only the tests for "Remote file retrieval" and "Command execution" can be performed against the target: `192.168.0.1 -T 58`
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

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[cirt.net]: https://cirt.net/
[nikto github]: https://github.com/sullo/nikto

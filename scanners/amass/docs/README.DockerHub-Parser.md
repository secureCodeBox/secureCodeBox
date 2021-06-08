<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Incubator Project" src="https://img.shields.io/badge/OWASP-Incubator%20Project-365EAA"></a>
  <a href="https://artifacthub.io/packages/search?repo=seccurecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/seccurecodebox"></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"></a>
</p>

## What is OWASP secureCodeBox?

_OWASP secureCodeBox_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://docs.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://docs.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://docs.securecodebox.io/docs/getting-started/first-scans) with it.

## Supported Tags
- `latest`  (represents the latest stable release build)
- tagged releases, e.g. `v3.13`
- `unstable` (represents the latest unstable build from the master branch. Not recommended for production systems)

## How to use this image
```bash
docker pull securecodebox/parser-amass
```

## What is OWASP Amass?

The OWASP Amass Project has developed a tool to help information security professionals perform network mapping of attack surfaces and perform external asset discovery using open source information gathering and active reconnaissance techniques. To learn more about the Amass scanner itself visit [OWASP_Amass_Project] or [Amass GitHub].

## Scanner Configuration

The following security scan configuration example are based on the [Amass User Guide], please take a look at the original documentation for more configuration examples.

- The most basic use of the tool for subdomain enumeration: `amass enum -d example.com`
- Typical parameters for DNS enumeration: `amass enum -v -src -ip -brute -min-for-recursive 2 -d example.com`

Special command line options:

- Disable generation of altered names `amass enum -noalts -d example.com`
- Turn off recursive brute forcing `amass enum -brute -norecursive -d example.com`
- Disable saving data into a local database `amass enum -nolocaldb -d example.com`
- Domain names separated by commas (can be used multiple times) `amass enum -d example.com`

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][owasp] project.

## License
View [license information](https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE) for the software contained in this image.
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

[owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-github]: https://github.com/secureCodeBox/
[scb-engine]: https://github.com/secureCodeBox/engine
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[owasp_amass_project]: https://owasp.org/www-project-amass/
[amass github]: https://github.com/OWASP/Amass
[amass user guide]: https://github.com/OWASP/Amass/blob/master/doc/user_guide.md
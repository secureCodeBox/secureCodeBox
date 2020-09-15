# secureCodeBox – v2 Beta

<p align="center">
  <img alt="secureCodeBox Logo" src="./docs/resources/securecodebox-logo.svg" width="500px">
  <img alt="secureCodeBox Logo" src="https://owasp.org/assets/images/logo.png" width="200px">
</p>

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox-v2/releases/tag/v2.0.0-rc.1"><img alt="Preview GitHub Release" src="https://img.shields.io/badge/release-v2.0.0%7Erc.1-blue.svg"></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Incubator Project" src="https://img.shields.io/badge/OWASP-Incubator%20Project-365EAA"></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"></a>
</p>
<p align="center">
  <a href="https://github.com/secureCodeBox/secureCodeBox-v2/actions?query=workflow%3ACI"><img alt="Build" src="https://github.com/secureCodeBox/secureCodeBox-v2/workflows/CI/badge.svg"></a>
  <a href="https://codeclimate.com/github/secureCodeBox/secureCodeBox-v2/test_coverage"><img alt="Test Coverage" src="https://api.codeclimate.com/v1/badges/b6bf3af707671b5e5251/test_coverage" /></a>
  <a href="https://snyk.io/test/github/secureCodeBox/secureCodeBox-v2/"><img alt="Known Vulnerabilities" src="https://snyk.io/test/github/secureCodeBox/secureCodeBox-v2/badge.svg"></a>
</p>

**NOTE**: This Repository contains the stable beta preview of the next major secureCodeBox (SCB) Release v2.  
You can find the current **stable release** here [https://github.com/secureCodeBox/secureCodeBox](https://github.com/secureCodeBox/secureCodeBox). 

_The major release of SCB version 2.0 will be available in the next weeks._ The release will contain a major architecture change which will not be backward compatible. More details will follow soon in a series of blog articles.

> _secureCodeBox_ is a kubernetes based, modularized toolchain for continuous security scans of your software project. Its goal is to orchestrate and easily automate a bunch of security-testing tools out of the box.

## Overview

<!-- toc -->

- [secureCodeBox – v2 Beta](#securecodebox--v2-beta)
  - [Overview](#overview)
  - [Purpose of this Project](#purpose-of-this-project)
  - [Quickstart](#quickstart)
    - [Prerequisites](#prerequisites)
    - [Deployment (based on Helm)](#deployment-based-on-helm)
    - [Examples](#examples)
      - [Local Scan Examples](#local-scan-examples)
      - [Public Scan Examples](#public-scan-examples)
      - [Then get the current State of the Scan by running:](#then-get-the-current-state-of-the-scan-by-running)
      - [To delete a scan, use ```kubectl delete```, e.g. for localhost nmap scan:](#to-delete-a-scan-use-kubectl-delete-eg-for-localhost-nmap-scan)
    - [Access Services](#access-services)
  - [How does it work?](#how-does-it-work)
  - [Architecture](#architecture)
  - [License](#license)
  - [Community](#community)
  - [Contributing](#contributing)
  - [Author Information](#author-information)

For additional documentation aspects please have a look at our:

- [User Guide](docs/user-guide/README.md)
- [Developer Guide](docs/developer-guide/README.md)

<!-- tocstop -->

## Purpose of this Project

The typical way to ensure application security is to hire a security specialist (aka penetration tester) at some point in your project to check the application for security bugs and vulnerabilities. Usually, this check is done at a later stage of the project and has two major drawbacks:

1. Nowadays, a lot of projects do continuous delivery, which means the developers deploy new versions multiple times each day. The penetration tester is only able to check a single snapshot, but some further commits could introduce new security issues. To ensure ongoing application security, the penetration tester should also continuously test the application. Unfortunately, such an approach is rarely financially feasible.
2. Due to a typically time boxed analysis, the penetration tester has to focus on trivial security issues (low-hanging fruits) and therefore will not address the serious, non-obvious ones.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The purpose of _secureCodeBox_ **is not** to replace the penetration testers or make them obsolete. We strongly recommend to run extensive tests by experienced penetration testers on all your applications.

**Important note**: The _secureCodeBox_ is no simple one-button-click-solution! You must have a deep understanding of security and how to configure the scanners. Furthermore, an understanding of the scan results and how to interpret them is also necessary.

There is a German article about [Security DevOps – Angreifern (immer) einen Schritt voraus][secdevops-objspec] in the software engineering journal [OBJEKTSpektrum][objspec].

## Quickstart

### Prerequisites

- kubernetes (last 4 major releases supported: `1.16`, `1.17`, `1.18` & `1.19`)

### Deployment (based on Helm)

> The install instrucions require you to have the repository cloned and to have your terminal located in the folder of repository.
> There are shorthand scripts to un-/install everything in the `bin` directory.

Deploy the secureCodeBox operator first:

```bash
kubectl create namespace securecodebox-system
helm -n securecodebox-system upgrade --install securecodebox-operator ./operator/
```

Optionally deploy SCB scanner charts for each security scanner you want to use. They should not be installed into the `securecodebox-system` like the operator so that different teams can use different kinds of scanners.

```bash
helm upgrade --install amass ./scanners/amass/
helm upgrade --install kube-hunter ./scanners/kube-hunter/
helm upgrade --install nikto ./scanners/nikto
helm upgrade --install nmap ./scanners/nmap/
helm upgrade --install ssh-scan ./scanners/ssh_scan/
helm upgrade --install sslyze ./scanners/sslyze/
helm upgrade --install trivy ./scanners/trivy/
helm upgrade --install zap ./scanners/zap/
helm upgrade --install wpscan ./scanners/wpscan/
```

Optional deploy some demo apps for scanning:

```bash
helm upgrade --install dummy-ssh ./demo-apps/dummy-ssh/
helm upgrade --install bodgeit ./demo-apps/bodgeit/
helm upgrade --install juice-shop ./demo-apps/juice-shop/
helm upgrade --install old-wordpress ./demo-apps/old-wordpress/
helm upgrade --install swagger-petstore ./demo-apps/swagger-petstore/
```

Deploy secureCodeBox Hooks:

```bash
helm upgrade --install ufh ./hooks/update-field/
helm upgrade --install gwh ./hooks/generic-webhook/
helm upgrade --install issh ./hooks/imperative-subsequent-scans/
helm upgrade --install dssh ./hooks/declarative-subsequent-scans/
```

Persistence provider Elasticsearch:

```bash
helm upgrade --install elkh ./hooks/persistence-elastic/
```

### Examples

Now everything is installed. You can try deploying scans from the `scanners/*/examples` directories.

#### Local Scan Examples

E.g. localhost nmap scan:

```bash
kubectl apply -f scanners/nmap/examples/localhost/scan.yaml
```

#### Public Scan Examples

```bash
kubectl apply -f scanners/nmap/examples/scan.nmap.org/scan.yaml
```

#### Then get the current State of the Scan by running:

```bash
kubectl get scans
```

#### To delete a scan, use ```kubectl delete```, e.g. for localhost nmap scan:
```
kubectl delete -f scanners/nmap/examples/localhost/scan.yaml
```

### Access Services

- Minio UI:
  - Port Forward Minio UI: `kubectl port-forward -n securecodebox-system service/securecodebox-operator-minio 9000:9000`
  - AccessKey: `kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.accesskey}' | base64 --decode; echo`
  - SecretKey: `kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.secretkey}' | base64 --decode; echo`
- Elastic / Kibana UI:
  - Port Forward Kibana: `kubectl port-forward -n default service/elkh-kibana 5601:5601`
  - Port Forward Elasticsearch: `kubectl port-forward -n default service/elasticsearch-master 9200:9200`

## How does it work?

## Architecture

![secureCodeBox Architecture](./docs/resources/scb-architecture.svg)

## License

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][owasp] project.

## Contributing

Contributions are welcome and extremely helpful 🙌

## Author Information

Sponsored by [iteratec GmbH](https://www.iteratec.de/) - [secureCodeBox.io](https://www.securecodebox.io/)

[owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[objspec]: https://www.sigs-datacom.de/fachzeitschriften/objektspektrum.html
[secdevops-objspec]: http://www.sigs.de/public/ots/2017/OTS_DevOps_2017/Seedorff_Pfaender_OTS_%20DevOps_2017.pdf
[scb-github]: https://github.com/secureCodeBox/
[scb-engine]: https://github.com/secureCodeBox/engine
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTJiNzg3MmU2ZDY2NDFiMGI0Y2FkM2I5Mzc2ZmEzYTcyN2FlN2Y2NDFiZDE5NjAxMjg1M2IxNDViNzE3OTIxMGU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

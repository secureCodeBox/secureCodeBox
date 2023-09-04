---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Introduction and Goals"
sidebar_label: "Introduction and Goals"
sidebar_position: 1
---
# Introduction and Goals {#section-introduction-and-goals}

Initially, the goal of _secureCodeBox_ was to provide a tool for easy integrating security test tools into your CI/CD pipeline to run against your web project. Some years ago we asked ourselves: Why only scan a single project? So a great idea was born: Consider the whole company as a project. Additionally, _secureCodeBox_ can aid penetration testers in the recon and discovery phase of a security assessment. The purpose of _secureCodeBox_ is not to replace the penetration testers or make them obsolete. We strongly recommend running extensive tests by experienced penetration testers on all your applications.

The following goals have been established for this project:

| **Priority** |                                                                                                                   |
|--------------|-------------------------------------------------------------------------------------------------------------------|
| 1            | The project shall be enhanced by features that are suitable to keep.                                              |
| 2            | The project is scalable and resource efficient (FaaS).                                                            |
| 3            | The project implements additional scanners that are a useful addition for the current suite, limiting redundancy. |
| 4            | The findings are displayed in a navigable way with least amount of duplication.                                   |
| 5            | SecureCodeBox starts new relevant scans in an agile way, based on previous findings.                              |

## Requirements Overview {#_requirements_overview}

The following use case diagram is only a visual overview of the most important use cases. We do not encourage to model all use cases in detail with UML because it is hard to grasp all nit-picky details of the official UML syntax. We just use bubbles and simple lines to show which actors need which use case scenario.

![Use-case diagram](/img/docs/architecture/use-case-diagram.png)

### Roles

| **Actor** | **Description**                                                                           |
|-----------|-------------------------------------------------------------------------------------------|
| Tester    | This role is the actual end user performing scans and evaluating the results.             |
| CI        | This role is a system periodically performing scans e.g. after build and deployment.      | 
| Operator  | This role operates the _secureCodeBox_ (mainly the k8s cluster and the _Engine operator_. |

### Use Cases

| **Id** | **Requirement**                   | **Explanation**                                                                                                      |
|--------|-----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| UC1    | Define scan                       | The _Tester_ defines scans with a _target_ reachable by network and _scan types_ to be executed against this target. |
| UC2    | Define cascading scan             | The _Tester_ defines a scan which triggers subsequent scans depending on the result of the current scan.             |
| UC3    | Initiate scan                     | The _Tester_ or _CI_ triggers a defined scan.                                                                        |
| UC4    | Get scan results                  | The _Tester_ retrieves the scan results for further examination.                                                     |
| UC5    | Deploy scan in namespace to k8s   | The _Operator_ or _Tester_ deploys a scan into a namespace to make it available for defining scans.                  |
| UC6    | Deploy scan cluster wide to k8s   | The _Operator_ deploys a scan cluster wide to make it available for defining scans.                                  |
| UC7    | Deploy engine cluster wide to k8s | The _Operator_ deploys the _Engine operator_ cluster wide to make secureCodeBox available.                           |

## Quality Goals {#_quality_goals}

Below, the most important qualities are described that this project strives for. The qualities are categorized using the [ISO 25010][iso-25010] standard. Most of these qualities are derived from blog post [The Architecture of secureCodeBox v2][blog-architecture]. For the entire list of quality-goals see [Quality Requirements](/docs/architecture/quality_requirements).

| **Category**           | **Quality**          | **Description**                                                      | **Scenario** |
|------------------------|----------------------|----------------------------------------------------------------------|--------------|
| Maintainability        | Modular              | All components should be loosely coupled to easily swap them         |              |
|                        | Ease of integration  | It should be possible to easily integrate new scanners               |              |
|                        | Ease of Contributing | SCB should be well documented                                        |              |
|                        | Ease of updating     | Third-party software should be carefully chosen, for maintainability | SC1          |
| Portability            | Adaptable            | SCB Should run everywhere (local, VMs, Cloud, etc.)                  | SC2          |
| Performance Efficiency | Resource Efficient   | SCB should scale to the available resources                          | SC3          |
|                        | Time Efficient       | Tasks should run parallel to optimize the use of resources           |              |
| Usability              | Ease of Integration  | The definition and implementation of a scan process should be easy   | SC4          |

### Scenarios

| **Id** | **Scenario**                                                                                          |
|--------|-------------------------------------------------------------------------------------------------------|
| SC1    | A third-party updates their software with a breaking change. Effort to support this update is minimal |
| SC2    | A company is running SCB in the cloud, due to limited resources on premise                            |
| SC3    | SCB is out of resources and a new scan is initiated. The scan is queued until resources are available |
| SC4    | A scan is easily created and started by writing and loading a config file                             |

## Stakeholders {#_stakeholders}

| **Company** | **Name**          | **Role**                 | **GitHub Account**                                 |
|-------------|-------------------|--------------------------|----------------------------------------------------|
| iteratec    | Robert Seedorff   | Product Owner            | [@rseerdorff](https://github.com/rseedorff)        |
|             | Sven Strittmatter | Scrum Master & Developer | [@Weltraumschaf](https://github.com/Weltraumschaf) |
|             | Jannik Hollenbach | Core Developer           | [@J12934](https://github.com/J12934)               |
|             | Max Maass         | Core Developer           | [@malexmave](https://github.com/malexmave)         |
|             | Ilyes Ben Dlala   | Core Developer           | [@Ilyesbdlala](https://github.com/Ilyesbdlala)     |
|             | Rami Souai        | Core Developer           | [@RamiSouai](https://github.com/RamiSouai)         |
| Secura      | Ralph Moonen      | CTO                      | N/A                                                |
|             | Sander Maijers    | Developer                | [@sanmai-NL](https://github.com/sanmai-NL)         |
|             | Stijn van Es      | Developer                | [@Stijn-FE](https://github.com/Stijn-FE)           |
|             | Ali Altun         | Developer                | N/A                                                |

[iso-25010]:          https://iso25000.com/index.php/en/iso-25000-standards/iso-25010
[blog-architecture]:  https://www.securecodebox.io/blog/2021/07/20/the-architecture-of-securecodebox-v2

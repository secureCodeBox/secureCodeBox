---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Architecture Decisions"
sidebar_label: "Architecture Decisions"
sidebar_position: 9
---
# Architecture Decisions {#section-design-decisions}

We use _architecture decision records (ADR)_ to [document our architecture decissions][adr-nygard]. We adopted the [template][adr-template] from [Joel Parker Henderson][gh-henderson].

You find all ADRs in the sidebar below this section. They are numbered and ordered in their time of emergence.

### Table of contents
| ADR                   | Title |
|-----------------------| ---- |
| [0001](./adr_0001.md) | Choosing the framework for the new secureCodeBox Website |
| [0002](./adr_0002.md) | How can we introduce a more general extension concept for data processing modules? |
| [0003](./adr_0003.md) | How can we introduce a mechanism to start specialized scans on the results of previous scans? |
| [0004](./adr_0004.md) | Which framework could be more useful for documentation purposes? |
| [0005](./adr_0005.md) | Buying separate marketing oriented webpage |
| [0006](./adr_0006.md) | Provide versioned documentation |
| [0007](./adr_0007.md) | Proposal How to Mark Findings With Hashes to Find Duplicates |
| [0008](./adr_0008.md) | Drop the Former Decision To Provide Versioned Documentation |
| [0009](./adr_0009.md) | Architecture for pre-populating the file system of scanners |
| [0010](./adr_0010.md) | Custom Inheritance Behavior for Affinity and Tolerations |
| [0011](./adr_0011.md) | Version Numbers |
| [0012](./adr_0012.md) | Cluster Wide Custom Resources |
| [0013](./adr_0013.md) | Autodiscovery v2 |
| [0014](./adr_0014.md) | Scan Metric Collection |
| [0015](./adr_0015.md) | Kubernetes As Orchestration Engine for Scans |
| [0016](./adr_0016.md) | S3 As Backend for Persistent Data |
| [0018](./adr_0018.md) | Spaces in File Names Are Not Allowed |
| [0019](./adr_0019.md) | OpenVAS Integration |

[adr-nygard]:   https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[adr-template]: https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/templates/decision-record-template-by-michael-nygard/index.md
[gh-henderson]: https://github.com/joelparkerhenderson

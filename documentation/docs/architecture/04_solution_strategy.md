---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
title: "Solution Strategy"
sidebar_label: "Solution Strategy"
sidebar_position: 4
---

# Solution Strategy {#section-solution-strategy}

This chapter describes the main technical concepts used as solution strategy to implement _secureCodeBox_. 

First lets narrow down the core responsibility of _secureCodeBox_. The whole system's responsibility is:

1. to **orchestrate various security scanners**, and
2. **process and persist the findings** from these scanner's results.

In version 1 we achieved this with an own application based on a business process engine. More about this topic and its drawbacks are described in the blog post [Why secureCodeBox 2.0](/blog/2021/06/07/why-securecodebox-version-2). Due to these drawbacks we [decided to use Kubernetes to manage scanners as custom resources][ADR-0015] and make an own implementation for this aspect of the system obsolete. More details about this decision is described in the previously linked ADR.

The move to [Kubernetes][k8s] as implementation of our orchestration has the consequence that we do not have the SQL persistence available as in typical Java based application stacks. So, we [decided to use S3 and its API as our main persistence layer][ADR-16]. More details about this decision is described in the previously linked ADR.

[ADR-0015]: /docs/architecture/architecture_decisions/adr_0015
[ADR-0016]: /docs/architecture/architecture_decisions/adr_0016
[k8s]:      https://kubernetes.io/

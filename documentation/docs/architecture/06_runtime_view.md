---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Runtime View"
sidebar_label: "Runtime View"
sidebar_position: 6
---
# Runtime View {#section-runtime-view}

This section describes the runtime view of _secureCodeBox_. In contrast to the static building block view, this view shows the interactions of participants (components/actors) over time. This is typically done with [sequence diagrams][wiki-uml-sequence].

Since sequence diagrams are hard to maintain and tend to be very complicated we focus here only on the top most important scenarios, and do not draw diagrams for every possible scenario.

## Runtime Scenario 1: Basic Scan with kubectl {#__runtime_scenario_1}

This scenario describes a simple [ZAP](/docs/scanners/zap) scan which is initialized by a _Developer_ actor and which persists the _findings_ in [Elastic][elastic] and [DefectDojo][defectdojo]. 

![Runtime view diagram](/img/docs/architecture/runtime-basic-scan-via-kubectl.png)

[wiki-uml-sequence]:  https://en.wikipedia.org/wiki/Sequence_diagram
[elastic]:            https://www.elastic.co/
[defectdojo]:         https://www.defectdojo.org/

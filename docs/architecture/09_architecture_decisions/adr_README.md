<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# Architecture Decision Records (ADRs)

This subdirectory contains all ADRs for the architecture documentation. The ids of these ADRs are within the number range from 0001 to 0999. The 0000 is reserved for the example template.

Architectural decisions are, where appropriate, documented with the ADR template from [Michael Nygard][nygard]. A template can be found at `adr_0000.md` and [here][template]. We extend this template with the date when this decision was made.

Important key points from the blog of [Michael Nygard][nygard]:

> We will keep a collection of records for "architecturally significant" decisions: those that affect the structure, non-functional characteristics, dependencies, interfaces, or construction techniques.
>
> Each record describes a set of forces and a single decision in response to those forces. Note that the decision is the central piece here, so specific forces may appear in multiple ADRs.
>
> We will keep ADRs in the project repository under `adr/NNNN.md`.
>
> ADRs will be numbered sequentially and monotonically. **Numbers will not be reused.**
>
> If a decision is reversed, we will **keep the old** one around, but mark it as superseded. (It's still relevant to know that it was the decision, but is no longer the decision.)

Please take a look in the ADR template `adr_0000.md` for more information about the internal structure.

[nygard]:       http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions
[template]:     https://github.com/joelparkerhenderson/architecture_decision_record/blob/master/adr_template_by_michael_nygard.md

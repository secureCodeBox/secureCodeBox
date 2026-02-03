---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Project Management"
---

Under the topic "project management" we describe how we do the organizational stuff besides coding such as on-/off-boarding new maintainers or contributors.

## Infrastructure

- We use GitHub for source code and issue management:
  - We have an own organization named [secureCodeBox](https://github.com/secureCodeBox/).
  - Management of issues is done with a corresponding [project](https://github.com/orgs/secureCodeBox/projects/6).
- We use the OWASP Google Workspace:
  - A [shared drive][google-shared-drive] to store meeting notes.
  - And a project calendar:
    - [Internal link](https://calendar.google.com/calendar/u/0?cid=Y19mODdhNThiMGNmZjNmMWMwMTk5ZjlhNDc1MjVjMmNiMGU3NjkwZmRjMTliZTI2NDlmMGU5YjlmMDA1ZTc3Mjc4QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20)
    - [Public link](https://calendar.google.com/calendar/u/0/embed?src=c_f87a58b0cff3f1c0199f9a47525c2cb0e7690fdc19be2649f0e9b9f005e77278@group.calendar.google.com&ctz=Europe/Berlin)

## Teams

### GitHub

In our [GitHub organization](https://github.com/secureCodeBox) we have several teams:

1. _admin-team_: Members are the _project leads_. 
2. _core-team_: Company sponsored core team.
3. _contributor-team_: Active contributors from the community.
4. _bot-team_: Team containing all bots allowed to push directly to the main branch.

### DockerHub

In our [DockerHub organization](https://hub.docker.com/u/securecodebox) we have several teams:

1. _adminteam_: Members are the _project leads_.
2. _coreteam_: Company sponsored core team.
3. _botteam_: Team containing all bot accounts.

### Sonatype (Maven Central)

In our [Sonatype organization](https://central.sonatype.com/) we have the namespace "io.securecodebox" for Java Maven artifacts.

Users of this namespace are the _project leads_ and a bot user for deployments.

## Organizational

- The _project leads_ do a regular sync meeting:
  - Monday 16:05-17:00 CET, every 4 weeks from 28.5.25 on. Next meetings: 23.6.25, 21.7.25 etc.
  - We write an agenda beforehand and notes in a Google Doc, one per meeting.
  - There is a template document in the shared drive.

## On- and Off-Boarding

For on- and off-boarding we create an issue for each member. On- and off-boardings need to be done by a member of the _admin-team_.

### On-boarding

- _core-team_:
  - Add to our GitHub organization with following roles:
    - core-team
    - contributer-Team
- _admin-team_ (additionally to the _core-team_ on-boarding):
  - Add to our GitHub organization with following roles:
    - admin-team
  - Register user at [Sonatype](https://central.sonatype.com/) & add to namespace "io.securecodebox"
  - Add to [OWASP valut](https://team-securecodebox.1password.com/).

### Off-boarding

- _core-team_:
  - Remove role:
    - core-team
- _admin-team_:
  - Remove role:
    - admin-team
  - Remove user from namespace "io.securecodebox" in [SonaType](https://central.sonatype.com/).
  - Remove access to [OWASP vault](https://team-securecodebox.1password.com/).

[google-shared-drive]: https://drive.google.com/drive/folders/1cwAjEyEabdj4By-Ox6ho49NiT-vQUeDq?usp=drive_link

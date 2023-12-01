---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: How Our Core Development Team Works
author: Sebastian Franz
author_title: Core Developer
author_url: https://github.com/SebieF
author_image_url: https://avatars.githubusercontent.com/u/32578476?v=4
tags:
  - secureCodeBox
  - agile
  - community
  - open source
description: This post gives some insights about how our core development team is organized.
image: /img/blog/2021-09-07-notes.jpg
---

![Notes](/img/blog/2021-09-07-notes.jpg)

Cover photo by [Kelly Sikkema](https://unsplash.com/@kellysikkema) on [Unsplash](https://unsplash.com/photos/-nz-GTuvyBw).

Learn how our core development team works and about how to collaborate with us! 

<!--truncate-->

## Introduction

The *secureCodeBox* is still a small, yet growing open source project. At the time of writing, 
the major share of work is done by roundabout eight developers from [Iteratec](https://iteratec.com).
That's also where the idea for the *secureCodeBox* was born about four years ago. 
Lately, we received a growing number of community contributions (Thank you!), which encourages us to reveal our
internal development process to a wider audience. We do so to enable you, if you will, to take an even more active
part in our development process (see last section).

## How We Work

Both, students and full-time developers, work together in our team. In addition, we are highly geographically
distributed all over Germany. This, of course, requires some coordination,
because especially the regular employees often have to take some time for the open source project only. 
That's why we are working in an *agile* setup and try to stick to the general ideas of 
[Scrum](https://www.scrum.org/resources/what-is-scrum) and [Kanban](https://en.wikipedia.org/wiki/Kanban_(development)).
We work in **sprints** of two weeks (regularly). For each sprint, our Product Owner (PO) decides, which tasks are the most
important to solve. Thereupon, our developers are free to coordinate and pick the issues they want to work on.
The communication itself happens on our internal MS Teams platform. To keep the community updated all our
tickets are publicly available on GitHub as [issues](https://github.com/secureCodeBox/secureCodeBox/issues). 
You can even get insight into our current sprint in our [GitHub Project](https://github.com/orgs/secureCodeBox/projects/5). 
The issues in the *To-Do* column are sorted by their importance regarding the current sprint.

For each issue, one or more developers will usually create a new branch in the repository and commit changes there.
After completion, a **Pull Request** (PR) will be created and reviewed by other members of the team. After all
our CI tests and the reviewer are satisfied, the PR gets merged automatically or by one of our admins.

## Review/Retro/Planning Session

The highlight of every sprint, finally, is our *Review/Retro/Planning* session. It lasts about two hours, while we first
**review** which results we achieved during the last sprint, i.e. which issues we worked on. We often show
new features that we added to the other developers and the Product Owner, or point out on problems that we are 
currently facing and how we want to solve them. Because of limited time, we don't discuss new features or problems
in-depth, as we also have a separate dev meeting for that.

Next up, we do a **retro**(-perspective) of the elapsed sprint. For example, we discuss what we liked, what we learnt
and what we missed in the past weeks. This can range from technical problems over theoretical learnings about security
to personal issues. It is designed as a safe space where everyone can freely speak his mind without fear of negative
consequences. We also try to stick to the principles of *Inspect* and *Adapt*, which means that we always want to 
improve on limitations and problems that we identified during the last sprint. 

Finally, we **plan** our next sprint, where issues will get prioritized by the product owner as described above.
Other team members will, of course, also be asked for their opinion on what to focus on and what will take how much time.
This ensures that the dreams of our product owner always stay realistic ;-).
After that, a new sprint starts over (but before we enjoy our weekend).

## Get Engaged!

You now know how our core development team is organized to work at the *secureCodeBox*.
If you are a regular user of the *secureCodeBox* and/or want to contribute more actively to the code, now is the best time to start!
Of course, you can stay "anonymous", create your own pull requests and issues in our repository or chat with our
developers about new features. If you, however, want to take one step further, we are very happy if you get in touch,
for example by writing us an [e-mail](mailto:securecodebox@iteratec.com) 
or joining our `#project-securecodebox` channel in the [OWASP Slack](https://owasp.org/slack/invite).

Of course, we will face some new challenges when we integrate new stakeholders and developers into our meetings.
The time span of our meeting is already quite tight for all that we have to discuss, and we would probably also have
to deal with different time zones. 
That is why we are very happy to hear from you and discuss, how we can get you involved into our development process
and find solutions together!

---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Backports"
---

In this section we describe how to maintain bug fixes in multiple versions of the _secureCodeBox_.

## TL;DR

:::caution
If you're unfamiliar with _backporting_ please read the full article!
:::

1. Determine the version affected with the bug (e.g. 2.1.0).
2. Checkout the affected _version tag_ (e.g. `git checkout 2.1.0`).
3. Create a _release branch_ for this version, unless it already exists (e.g. `git checkout -b 2.x`)
4. Make the bugfix (e.g. commit `24d383b`).
5. Make a new tagged version in this _release branch_ (e.g. `git tag 2.1.1`).
6. Backport to maintained **older** versions:
   1. Checkout older _version tag_ (e.g. `git checkout 1.5.0`).
   2. Create a _release branch_ for this version, unless it already exists (e.g. `git checkout -b 1.x`)
   3. Cherry-pick the bugfix (e.g. `git cherry-pick 24d383b`)
   4. Push the _release branch_ upstream.
   5. Release a new patch version for this _release branch_ (e.g. 1.5.1).
   6. Repeat from 1. until you fixed all maintained **older** versions.
7. Backport to maintained **newer** versions:
   1. Checkout newer _version tag_ (e.g. `git checkout 3.2.1`).
   2. Create a _release branch_ for this version, unless it already exists (e.g. `git checkout -b 3.x`)
   3. Cherry-pick the bugfix (e.g. `git cherry-pick 24d383b`)
   4. Push the _release branch_ upstream.
   5. Release a new patch version for this _release branch_ (e.g. 3.2.2).
   6. Repeat from 1. until you fixed all maintained **newer** versions.
8. Checkout _main branch_ (e.g. `git checkout main`).
9. Cherry-pick the bugfix (e.g. `git cherry-pick 24d383b`)
10. Push the main branch upstream.

## What is the Problem?

We follow [Semantic Versioning][semver] in the _secureCodeBox_ source code. This means we introduce new major versions for each backward incompatible breaking change. Our first major breaking change was the introduction of [version 2.0][scb-version-2]. What if someone finds a critical bug in an older major version? For example, we are currently in version 3.x and the bug was introduced in version 2.x. A naive approach is to simply fix the bug in the current head version. But this leaves all users of older versions alone with the bug. This is why you typically want backporting of such critical bugs, because some users can't upgrade for good reasons to a new major version.

## What is Backporting?

In general backporting means that you not only fix a bug in the current head version, but also fix it in older maintained versions. This means that you mast port that bugfix back to this older versions (hence the name backporting). For example: We have a critical bug in version 2.x which is also present in version 3.x. In this particular example we need to fix the bug in the 2.x _release branch_ and additionally fix it in the current _main branch_. Finally, we must release two new versions: A head release (e.g. version 3.0.1) and also _release branch_ version (e.g. 2.0.1).

### Main Branch? Release Branch? WTF?

In simple projects with only few consumers of your software, you typically follow a so-called _main branch development_ philosophy. This means you only have one _main branch_ to maintain. In very small projects you don't even need any tagged versions. You just push to _main branch_ and the consumers use the latest _head version_.

But if you don't want to bother customers with breaking changes you need versions. A very good approach is to use [Semantic Versioning][semver] to help tell customers, if an upgrade will break theircurrent setup. [Semantic Versioning][semver] in short is very simple:

* Use a **three digit** version number scheme: MAJOR.MINOR.PATCH (e.g. 1.0.0).
* The **first digit** indicates major **breaking** changes: E.g. an increment from 1.0.0 to 2.0.0 tells you that it is very likely that something will break, and you must adjust your setup.
* The **second digit** indicates the introduction of **non-breaking** new features: E.g. an increment from 2.0.0 to 2.1.0 tells you that you get new features, but your setup will not break, and you need no adjustment of your setup.
* The **third digit** indicates **non-breaking** bugfixes: E.g. an increment from 2.0.0 to 2.0.1 tells you can deploy this version without thinking about anything going wrong.

:::caution 
Sometimes a bugfix require changes which will break an existing setup. If this is the case **you must increment** the _major version_, and not only the _patch version_.
:::

To achieve this you need to introduce versions in your software project. Typically, this is done by introducing _tagged versions_. If your project is based on Git usually this is done with `git tag`. You can simply do this by hand (e.g. by invoking `git tag 1.0.0` on your _head version_), but it is highly recommended to do this automated by _release pipelines_. For a simple project this may look like this in git:

```text
6273db7 (HEAD -> main) Adds sixth feature
732d3a1 (tag: 1.1.0) Adds fifth feature
24d383b Adds fourth feature
fd9b40f (tag: 1.0.1) Fixes bug in third feature
61486a5 Fixes bug in first feature
05cd59a (tag: 1.0.0) Adds third feature
7fdb08c Adds second feature
1114de3 Adds first feature
661378d Init
```

In the above example you see that there is only one _major version_ (1.x). There were some minor (feature) and patch (bugfix) versions. The latest _tagged_ version is 1.1.0. There is also one new feature untagged in the _head version_. We call this _unreleased_. If you only have one _major version_ then life is easy: You simply implement features and fix bugs and tag a new version.

But what to do if you have a major breaking change in the "sixth feature"? Of course, you must introduce a new _major version_:

```text
6273db7 (HEAD -> main, tag: 2.0.0) Adds sixth feature
732d3a1 (tag: 1.1.0) Adds fifth feature
24d383b Adds fourth feature
fd9b40f (tag: 1.0.1) Fixes bug in third feature
61486a5 Fixes bug in first feature
05cd59a (tag: 1.0.0) Adds third feature
7fdb08c Adds second feature
1114de3 Adds first feature
661378d Init
```

What to do if you have a critical bug in the "third feature"? Obviously you fix it in the main branch and do a new 2.0.1 release, right? Yes, you can do that, but this would be quite a badass move because this leaves all users of version 1.0.0, 1.0.1 and 1.1.0 behind with a critical bug. Typically, you want to deploy critical bugs as fas tas possible without fixing the whole setup due to breaking changes. Because such breaking changes may introduce lots of work or downtime, which may be unacceptable.

The solution is to maintain so-called _release branches_ and fixing bugs in all of them. In this case we need a _release branch_ for version 1.x and fix the bug there:

```text
d0e5033 (HEAD -> 1.x, tag: 1.1.1) Fix critical bug in third feature
732d3a1 (tag: 1.1.0) Adds fifth feature
24d383b Adds fourth feature
fd9b40f (tag: 1.0.1) Fixes bug in third feature
61486a5 Fixes bug in first feature
05cd59a (tag: 1.0.0) Adds third feature
7fdb08c Adds second feature
1114de3 Adds first feature
661378d Init
```

As you can see, you're no longer on _main_ branch, but on the so-called _release branch_ "1.x". It is recommended to name the release branch according the major version it branches of. In this example the major version is 1.0.0, so we name the _release branch_ "1.x". We fix the bug in this branch and release a new bugfix version "1.1.1".

Now we need to fix this bug also in the main branch. In case of git you simply switch back to _main branch_ and [cherry-pick][git-cherry-pick] the commit with the bugfix into the _main branch_ and release a new bugfix version, too:

```text
3a34c84 (HEAD -> main, tag: 2.0.1) Fix critical bug in third feature
6273db7 (tag: 2.0.0) Adds sixth feature
732d3a1 (tag: 1.1.0) Adds fifth feature
24d383b Adds fourth feature
fd9b40f (tag: 1.0.1) Fixes bug in third feature
61486a5 Fixes bug in first feature
05cd59a (tag: 1.0.0) Adds third feature
7fdb08c Adds second feature
1114de3 Adds first feature
661378d Init
```

From now on you have two branches (until you decide to no longer maintain version 1.x):

![Example with one release branch](/img/docs/backports/simple_example_with_one_release_branch.png)

## Where to Fix the Bug Initially

From a naive perspective you fix the bug obviously in the head version of the _main branch_ and then backporting it into all affected _release branches_. That's why it is named "backporting". But this approach is not always sufficient in a complex project. You have to keep in mind

- the bug may not exist in _main head version_ because it was fixed by accident or
- you did massive refactorings which makes simple cherry-picking into older _release branches_ impossible and
- you have to figure out which _release branches_ are affected by the bug.

One good practice is to initially fix the bug int the branch where it occurred. Also, a good practice is to first implement a _regression test_ which provokes the bug and fail initially. It is highly recommended to add this tests in a separate commits. Now the process is to go back all maintained older version (checkout their _Release branch_) and verify if the bug is there. Simply by looking at the source code, if it's a simple bug or by chery-picking the regression test and execute it. If the branch is affected then cherry-pick the bugfix commits. Then go through all newer release branches until up to the _main branch_ and do the same. (This is also called backporting, although it does not go backward but forward.)

:::note 
It's quite debatable if this approach is the best. We made good experience with this approach. Anyway whatever approach is used at the end, one thing is important: Define one approach and always stick to it. Otherwise, you will lose the overview where to fix the bug and where it is already fixed.

Also, it is not always possible to simply cherry-pick a bugfix. This may have different reasons:

- The commit does not only contain the bugfix, but also some refactorings or cleanups: **NEVER DO THIS**! For such "hot fixes" bluntly implement the sole bugfix, nothing else. If you want to do refactoring or cleanups? Fine, but do this in different commits. Unless the person who must do the backporting will hate you 😉
- There were refactorings done on the way to newer versions: In this case the person who do the backport need to implement the bugfix again and can't simply cherry-pick it. To help for this case you must note the previous bullet point 😉 
:::

[scb-version-2]:    /blog/2021/06/07/why-securecodebox-version-2
[semver]:           https://semver.org/
[git-cherry-pick]:  https://git-scm.com/docs/git-cherry-pick

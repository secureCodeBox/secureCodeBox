---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Contribution criteria"
sidebar_position: 0
---

Thank you for your interest in contributing to the Open Source repository of the *secureCodeBox*. Your effort is much
appreciated! On this site, we list the requirements to get your pull request (PR) merged to the main branch. 
For more information about contributing in general, please refer to our [contributing file](https://github.com/secureCodeBox/secureCodeBox/blob/45f6979f5ca0c81c25384543f7434127c7a48c7f/CONTRIBUTING.md).

## Content related criteria

To avoid any frustration on your side before you even got started, please decide into which category the content of
your PR will fall. Creating an [issue](https://github.com/secureCodeBox/secureCodeBox/issues) in our main repository
is a good way to get an overview of what has to be done and get feedback early! To create an issue is also a 
must-have for any change that takes longer than one hour to complete.

### Merge after approving review

Given that the formal acceptance criteria (see below) are met, we will merge the following sorts of PRs without 
additional internal discussion:
* Bug fixes
* Documentation enhancements
* Maintenance work such as code style or typo fixes

### Merge only after team decision

PRs other than the ones above will be discussed by the core developer team. We will stay in close
contact with you regarding the decision process. If you think that your PR falls into that category, it might be
worth to [get in touch](https://www.securecodebox.io/blog/2021/09/07/how-we-work#get-engaged) before you get started.

* Updates to existing features (operator, scans, hooks, auto-discovery, tests)
* New features (especially scanners, hooks, tests)
* Breaking changes (especially operator, auto-discovery)

The reason behind why your PR can possibly get rejected could be that we might not have enough capacity to maintain your 
PR in the future, that it might be too specific (e.g. introducing a scanner that has similar functionality as an
already existing one) or that it does not fit into the current overall development strategy of the *secureCodeBox*. 
If that is the case, you might still want to add your new feature to our 
[custom community contributions](/docs/community-features/scanners-and-hooks).

## Formal acceptance criteria

If your PR meets the content-related acceptance criteria above, you then only have to make sure that our formal criteria
are also met. Here is an overview about them:

* DCO compliance
* All checks completed successfully
* Changes approved
* Optional: Verified commits

### DCO compliance

Each commit must contain the signed-off-by tag with your real name and email address at the bottom:

```text
Signed-off-by: gordon shumway <alf@melmak.com>
```

Committing with `git commit -s` will add the sign-off at the end of the commit message automatically for you.
In addition, if it is your first time to contribute, please also add your name and e-mail to the 
[list of contributors](https://github.com/secureCodeBox/secureCodeBox/blob/45f6979f5ca0c81c25384543f7434127c7a48c7f/CONTRIBUTORS.md).
You can simply do that as a change in your PR.

### All checks completed successfully

Please make sure that all tests run successfully on your forked branch. If it is your first time contributing,
our GitHub workflow has to be approved by a core developer (which is usually done as soon as possible). 
Please feel free to open a *draft PR* if you need early feedback here.

### Changes approved

If you are done with your PR, you can request a review from one of our core team developers. The developer (or 
another member of the team that is free) will then review your PR and might request changes. Once everything is fixed
and looks good, your PR will be approved and get merged as soon as possible. Thank you for contributing! :)

### Optional: Verified commits

Please make sure that you are using a method to 
[sign your commits on GitHub](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).
This, however, is a strict requirement only for our core developer team. But you can increase the trustworthiness 
of all your contributions to any open source project by signing your commits.
"Signing your commits" is not to be confused with the "Sign-off" (see DCO compliance above), which is mandatory for
legal reasons.

<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# Contributing

- [Contributing](#contributing)
  - [GitHub Flow](#github-flow)
    - [How to work with GitHub Flow](#how-to-work-with-github-flow)
  - [Working with Forks and Pull Requests](#working-with-forks-and-pull-requests)
  - [Bugfixing and Security Fixing Released Features](#bugfixing-and-security-fixing-released-features)
  - [Working with Issues - How to Contribute in Issues](#working-with-issues---how-to-contribute-in-issues)
  - [How to Write Commit Messages](#how-to-write-commit-messages)
  - [Code of Conduct](#code-of-conduct)
  - [Developer Certificate of Origin and Licensing](#developer-certificate-of-origin-and-licensing)

## GitHub Flow

For more information see [GitHub Flow](https://githubflow.github.io/)

GitHub Flow is very lightweight (especially compared to GitFlow).
This workflow uses only two kinds of branches:

- Feature branch
- Main branch (previously called master)

The _feature_ branches are used to develop new features as well as fixes.
These branches are usually created out of main.

Anything in the _main_ branch is deployable.
The _main_ branch is expected to be deployed regularly and is considered stable.

### How to work with GitHub Flow

For more information see [GitHub Flow](https://githubflow.github.io/)

TL;DR

1. anything in the _main_ branch is deployable
2. create descriptive branches off of main
3. push to named branches constantly
4. open a pull request at any time
5. merge only after pull request review
6. deploy immediately after review

**_Please make sure to sign all your commits (See: [git-scm](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work))._**

## Working with Forks and Pull Requests

**_Please make sure to sign all your commits (See: [git-scm](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work))._**

If you want to contribute you will need to fork the project.
To enable the use of our CI Pipeline you will need to add these GitHub secrets:

| Secret           | Usage |
|------------------|--------|
| DOCKER_NAMESPACE | This is the namespace for the docker images. For the main repository this is *securecodebox*. On you fork this is probably your Docker user |
| DOCKER_USERNAME  | This is the username that is used to push the Docker images |
| DOCKER_TOKEN     | This is the Token that enables the CI to push |
| CC_TEST_REPORTER_ID | Your Codeclimate ID (optional) |

If you want early feedback feel free to open a *Draft Pull Request*.
When you are done, you can convert it to a standard *Pull Request* (or create one if you did not create a *Draft Pull Request*).

Generally the _secureCodeBox_ project follows the standard [GitHub Pull request process](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests).

**_Please make sure to sign all your commits (See: [git-scm](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work))._**

## Bugfixing and Security Fixing Released Features

For bugfixes and security fixes of the current release please follow the following workflow:
- For the minor release
  - Checkout current minor release branch (e.g. v2.5.x) or create if not existent from latest git tag
  - Create a bugfix branch from release branch
  - Fix Bug
  - Create PR to release branch
  - Generate new semver release
- For the main branch:
  - Create a bugfix branch from `main` branch
  - Cherry-Pick Bugfix and commit to bugfix branch
  - Create PR to `main` branch

## Working with Issues - How to Contribute in Issues

It is mandatory to open an issue, if the task takes longer than one hour.
Before you open an issue please verify there is no existing one covering your issue.

## How to Write Commit Messages

For more information see [Chris Beams article](https://chris.beams.io/posts/git-commit/).

TL;DR

1. Separate subject from body with a blank line
2. Limit the subject line to 50 characters
3. Capitalize the subject line
4. Do not end the subject line with a period
5. Use the imperative mood in the subject line
6. Wrap the body at 72 characters
7. Use the body to explain what and why vs. how

**NOTE**: Make sure you don't include `@mentions` or `fixes` keywords in your git commit messages. These should be included in the PR body instead.

**NOTE**: Make sure to add your signed-off-by tag as described in our [contributors file][contributors-file].

## Code of Conduct

Please have a look at our [Code of Conduct](./CODE_OF_CONDUCT.md) before you write an Issue or make a PR.

## Developer Certificate of Origin and Licensing

We decided to use [DCO](https://en.wikipedia.org/wiki/Developer_Certificate_of_Origin) instead of [CLA](https://en.wikipedia.org/wiki/Contributor_License_Agreement) as described in [CLAs and using DCO clearly](https://medium.com/@flamefew/clas-and-using-dco-clearly-e46b09a4c048). The reason for that: We need to be sure that one submitting a contribution to this repository is allowed to do this and does not violates copyrights of someone else. For that purpose you have to do some steps to to fullfil our DCO requirements:

1. Read carefully our [contributors file][contributors-file].
2. Open a pull request which adds you to the [contributors file][contributors-file] to agree the DCO.
3. Always add a signed-of tag to all your commits as described in the [contributors file][contributors-file].
4. Add a SPDX license header to all files your contribution will create. You can use the [reuse tool](https://reuse.software) with our [helper script](./bin/add-license-header.sh).

[contributors-file]: ./CONTRIBUTORS.md

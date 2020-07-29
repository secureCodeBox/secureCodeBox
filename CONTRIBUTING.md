# Contributing

- [Contributing](#contributing)
  - [GitHub Flow](#github-flow)
    - [How to work with GitHub Flow](#how-to-work-with-github-flow)
  - [Working with Forks and Pull Requests](#working-with-forks-and-pull-requests)
  - [Working with Issues / How to Contribute in Issues](#working-with-issues--how-to-contribute-in-issues)
  - [How to Write Commit Messages](#how-to-write-commit-messages)
  - [Code Review](#code-review)
  - [Code of Conduct](#code-of-conduct)
  - [Code Style](#code-style)

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

## Working with Forks and Pull Requests

Our current continuous integration workflow makes it very hard to work on own forks of the _secureCodeBox_ because CI tests cannot be executed outside of our repository. We are aware of that problem and are working on a solution.

Generally the _secureCodeBox_ project follows the standard [GitHub Pull request process](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests).

## Working with Issues/How to Contribute in Issues

It is mandatory to open an issue, if the task takes longer than one hour.
Before you open an issue please verify there is no existing one covering your issue.

## How to Write Commit Messages

For more information see [here](https://chris.beams.io/posts/git-commit/).

TL;DR

1. Separate subject from body with a blank line
2. Limit the subject line to 50 characters
3. Capitalize the subject line
4. Do not end the subject line with a period
5. Use the imperative mood in the subject line
6. Wrap the body at 72 characters
7. Use the body to explain what and why vs. how

NOTE: Make sure you don't include `@mentions` or `fixes` keywords in your git commit messages. These should be included in the PR body instead.

## Code Review

## Code of Conduct

Please have a look at our [Code of Conduct](./CODE_OF_CONDUCT.md) before you write an Issue or make a PR.

## Code Style



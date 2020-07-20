# Contributing

There are multiple different workflows with different advantages and disadvantages.
The most common workflows are:

- [GitFlow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [GitHub Flow](https://githubflow.github.io/)
- [GitLab Flow](https://about.gitlab.com/blog/2014/09/29/gitlab-flow/)

## GitHub Flow (How we want to work)

GitHub Flow is very lightweight (especially compared to GitFlow).
This workflow uses only two kinds of branches:

- Feature branch
- Main branch (previously called master)

The `feature` branches are used to develop new features as well as fixes.
These branches are usually created out of main.

Anything in the `main` branch is deployable.
The `main` branch is expected to be deployed regularly and is considered stable.

### How to work with GitHub Flow

For more Information see [GitHub Flow](https://githubflow.github.io/)

TL;DR

1. anything in the main branch is deployable
2. create descriptive branches off of main
3. push to named branches constantly
4. open a pull request at any time
5. merge only after pull request review
6. deploy immediately after review

### Why not GitLab Flow or GitFlow

Both `GitLab Flow` and `GitFlow` are to complex for our use case.

## Working with The Community / Working with Forks

Our current continuous integration workflow makes it very hard to work on own forks of the SecureCodeBox because CI tests cannot be executed outside of our repository. We are aware of that problem and are working on a solution.

## Working with Issues

`GitHub Flow` does not enforce you to use Issues but it is highly encouraged.
It is recommended to use an Issue for every Task taking longer than 1h (See [GitLab Flow](https://about.gitlab.com/blog/2014/09/29/gitlab-flow/)).

## How to Write Commit Messages

For more Information see [here](https://chris.beams.io/posts/git-commit/).

TL;DR

1. Separate subject from body with a blank line
2. Limit the subject line to 50 characters
3. Capitalize the subject line
4. Do not end the subject line with a period
5. Use the imperative mood in the subject line
6. Wrap the body at 72 characters
7. Use the body to explain what and why vs. how

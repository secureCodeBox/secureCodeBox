---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Testing Concept"
sidebar_label: "Introduction"
sidebar_position: 1
---

## Introduction
To ensure the functionality of our project, we make use of automated tests in our Continuous Integration (CI) pipeline. This allows us to have feedback on whether newly implemented and old functionalities are operating correctly.  
It's also important that this feedback is fast to not delay our operations. That is why, a good balance between unit tests and integration tests has to be struck.  
For that, we refer to the Martin Fowler [article](https://martinfowler.com/articles/practical-test-pyramid.html) that presents the fundamentals on creating a good testing pyramid. In a testing pyramid, tests that require more CPU time are at the top of the pyramid and are few. The opposite happens the lower you go in the pyramid.

This is the testing pyramid for the SecureCodeBox:

![scb-testing-structure](/img/docs/testing/scb-testing.png)

We have unit tests for the different SCB modules (e.g. Operator, Hook, Scanner ...). These tests are meant to be fast. For our integration test, we run a complete SCB scan in a Kind Cluster and we evaluate the resulted findings.
The following articles describe how each module implements its unit and integration tests:

* [Operator](/docs/contributing/test-concept/operator-test)
* [Scanner](/docs/contributing/test-concept/scanner-test)
* [Hook](/docs/contributing/test-concept/hook-test)
  
We use Make as a basis for our testing framework. The Makefiles expect additional software to be installed:  
git, node + npm, docker, kind, kubectl, helm and [yq](https://github.com/mikefarah/yq/).

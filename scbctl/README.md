<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# scbctl - CLI for secureCodeBox

The main purpose of scbctl is to provide an easier way to manage secureCodeBox CustomResources in Kubernetes, reducing the complexity of using kubectl and helm for common secureCodeBox operations.

## Installation

At the moment we do not provide precompiled binaries for the `scbctl`.
If you have go installed installing it is as simple as running:

```bash
go install github.com/secureCodeBox/secureCodeBox/scbctl@latest
```

Make sure that your golang home `bin` directory is part of your shell path.
If you don't know where your go home directory is run `go env GOPATH`.

## Commands

To find out more about the commands & functionalities supported by `scbctl`, run `scbctl --help` or refer to the [scbctl documentation](https://www.securecodebox.io/docs/scbctl/overview).

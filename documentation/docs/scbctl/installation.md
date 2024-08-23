---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Installation of scbctl"
description: "How to install the secureCodeBox cli (scbctl)"
sidebar_position: 2
---

To install `scbctl`:

At the moment we do not provide precompiled binaries for the `scbctl`.
If you have go installed installing it is as simple as running:

```bash
go install github.com/secureCodeBox/secureCodeBox/scbctl@latest
```

Make sure that your golang home `bin` directory is part of your shell path.
If you don't know where your go home directory is run `go env GOPATH`.

---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Coding Conventions"
sidebar_position: 5
---

## Guidelines

> ✍ **Following...**

### Coding Guidelines

> ✍ **Following...**

#### JSON

We're using snake_case (lower case) for json attributes. If an enum type is used as attribute it's converted to lower case. If it's a value it's always used UPPERCASE. This is to hold the attribute api consistent, but make sure Enums are recognized as enums.

```json
{
  "id": "e18cdc5e-6b49-4346-b623-28a4e878e154",
  "name": "Open mysql Port",
  "description": "Port 3306 is open using tcp protocol.",
  "category": "Open Port",
  "osi_layer": "NETWORK",
  "severity": "INFORMATIONAL",
  "attributes": {
    "protocol": "tcp",
    "port": 3306,
    "service": "mysql",
    "mac_address": null,
    "start": "1520606104",
    "end": "1520606118",
    "ip_address": "127.0.0.1",
    "state": "open"
  },
  "location": "tcp://127.0.0.1:3306"
}
```

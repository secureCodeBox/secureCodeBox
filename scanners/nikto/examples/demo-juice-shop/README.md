<!--
SPDX-FileCopyrightText: the secureCodeBox authors
SPDX-License-Identifier: Apache-2.0
-->

In this example we execute an kubeaudit scan against the intentional vulnerable [juice-shop](https://github.com/juice-shop/juice-shop)

#### Initialize juice-shop in cluster

Before executing the scan, make sure to setup juice-shop
```bash
helm upgrade --install juice-shop secureCodeBox/juice-shop --wait
```

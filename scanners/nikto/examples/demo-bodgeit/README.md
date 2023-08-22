<!--
SPDX-FileCopyrightText: the secureCodeBox authors
SPDX-License-Identifier: Apache-2.0
-->

In this example we execute an nikto scan against the intentional vulnerable [bodgeit](https://github.com/psiinon/bodgeit)

#### Initialize bodgeit in cluster

Before executing the scan, make sure to setup bodgeit
```bash
helm upgrade --install bodgeit secureCodeBox/bodgeit --wait
```

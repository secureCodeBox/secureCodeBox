<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

:::note
For this example to work, you must add a valid API Token to the scan.yaml!
:::

In this example we execute an wpscan scan against an old wordpress 4.0 instance [old-wordpress](https://github.com/secureCodeBox/secureCodeBox/tree/main/demo-targets/old-wordpress)

#### Initialize old-wordpress in cluster

Before executing the scan, make sure to setup old-wordpress

```bash
helm upgrade --install old-wordpress secureCodeBox/old-wordpress --wait
```

Then, add an API Key in scan.yaml by replacing the `TODO` after the --api-token flag.

After that you can execute the scan in this directory:
```bash
kubectl apply -f scan.yaml
```
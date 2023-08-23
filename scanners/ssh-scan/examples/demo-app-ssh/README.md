<!--
SPDX-FileCopyrightText: the secureCodeBox authors
SPDX-License-Identifier: Apache-2.0
-->

In this example we execute an kubeaudit scan against the intentional vulnerable [dummy-ssh](https://github.com/secureCodeBox/secureCodeBox/tree/main/demo-targets/dummy-ssh)

#### Initialize dummy-ssh in cluster

Before executing the scan, make sure to setup dummy-ssh

```bash
helm upgrade --install dummy-ssh secureCodeBox/dummy-ssh --wait
```

After that you can execute the scan in this directory:
```bash
kubectl apply -f scan.yaml
```
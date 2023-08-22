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

After that you can execute the scan in this directory:
```bash
kubectl apply -f scan.yaml
```

#### Troubleshooting:
<b> Make sure to install juice-shop in the same namespace as the scanner!</b>
If you juice-shop runs in, e.g., the `kubeaudit-tests` namespace, install the chart and run the scan there too
```bash
# Install HelmChart in kubeaudit-tests namespace
helm upgrade --install kubeaudit secureCodeBox/kubeaudit -n kubeaudit-tests
# Run scan in kubeaudit-tests namespace
kubectl apply -f scan.yaml -n kubeaudit-tests
```
Also, you must adjust the namespace in the scan.yaml with the `-n` flag.

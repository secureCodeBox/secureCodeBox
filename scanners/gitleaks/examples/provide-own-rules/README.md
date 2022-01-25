<!--
SPDX-FileCopyrightText: 2021 iteratec GmbH

SPDX-License-Identifier: Apache-2.0
-->

If you don't want to use our predefined rule files you can easily provide your own
gitleaks rules config file. To do this, create a `configMap` from your rules file:

```bash
kubectl create configmap --from-file /path/to/my/gitleaks-config.toml gitleaks-config
```

Now just mount that config in your scan and select the mounted path for your gitleaks 
`--config` option.

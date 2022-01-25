<!--
SPDX-FileCopyrightText: 2021 iteratec GmbH

SPDX-License-Identifier: Apache-2.0
-->

In some cases, you may have to authenticate to clone a repository.
For this, you can place your relevant access token in a Kubernetes secret:

```bash
# Don't forget the leading whitespace in the command to avoid 
# having your GitHub access token in your shell history!
 echo -n 'gh_abcdef...' > github-token.txt  # use -n to avoid trailing line break
kubectl create secret generic github-access-token --from-file=token=github-token.txt
rm github-token.txt
```

Then, you can use this token to perform an authenticated HTTPS clone, like in the following example.
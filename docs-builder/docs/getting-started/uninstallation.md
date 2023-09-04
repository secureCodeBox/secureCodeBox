---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "secureCodeBox Uninstallation"
sidebar_label: Uninstallation
path: "docs/getting-started/uninstallation"
---

## Uninstall Scanner / Hook

If you want to uninstall every scanner and every hook you can simply delete the namespace in which they were installed (if you did not install any resources you still need in the same namespace).

If you want to uninstall specific scanners or hooks you can delete them via `helm`. For example if you installed nmap using `helm install nmap secureCodeBox/nmap` you can delete nmap like this:

```bash
helm delete nmap
```

## Uninstall CascadingRules

If you want to delete some CascadingRules you can do so using `kubectl`.
For example if you want to uninstall a Cascading Rule for nmap:

```bash
kubectl delete cascadingrules.cascading.securecodebox.io nmap-hostscan
```

## Uninstall the Operator and Its Roles, ServiceAccounts and RoleBindings

To uninstall the operator it is not enough to delete the operator via `helm` because the operator creates Roles, ServiceAccounts and RoleBindings used by parsers, lurkers and hooks in every namespace where scanners and hooks are executed. These cannot be uninstalled via helm because they cannot be referenced via Kubernetes OwnerReferences.

Make sure you delete all scans and uninstall all scanners/hooks before uninstalling the operator to avoid problems.
First delete the namespace for the operator:

```bash
kubectl delete namespace securecodebox-system
```

### Delete Roles, RoleBindings and ServiceAccounts

The operator creates ServiceAccounts, Roles and RoleBindings in *every namespace* where scans / hooks are executed. You will have to delete these manually for each namespace where scans were scheduled.
The given examples are valid only for scanners that were executed in the default namespace.

To list the ServiceAccounts, Roles and RoleBings that were created by the operator you can execute the flowing command:

```bash {1}
kubectl get roles,rolebindings,serviceaccounts lurker parser
NAME                                     CREATED AT
role.rbac.authorization.k8s.io/lurker   2020-10-14T11:15:38Z
role.rbac.authorization.k8s.io/parser    2020-10-14T11:17:54Z

NAME                                            ROLE           AGE
rolebinding.rbac.authorization.k8s.io/lurker   Role/lurker   85m
rolebinding.rbac.authorization.k8s.io/parser    Role/parser    83m

NAME                     SECRETS   AGE
serviceaccount/lurker   1         85m
serviceaccount/parser    1         83m
```

To delete the Roles for lurker and parser you can execute the following command:

```bash
kubectl delete roles lurker parser
```

To delete the RoleBindings for lurker and parser you can execute:

```bash
kubectl delete rolebindings lurker parser
```

To delete the ServiceAccounts for lurker and parser you can execute:

```bash
kubectl delete serviceaccounts lurker parser
```

### Delete CRDs

Deleting the namespace of the operator will not delete the Custom Resource Definitions (CRDs) that were defined. To list all CRDs you can execute the following command:

```bash {1}
kubectl get crds
NAME                                             CREATED AT
cascadingrules.cascading.securecodebox.io        2020-10-14T09:32:19Z
parsedefinitions.execution.securecodebox.io      2020-10-14T09:32:19Z
scancompletionhooks.execution.securecodebox.io   2020-10-14T09:32:19Z
scans.execution.securecodebox.io                 2020-10-14T09:32:19Z
scantypes.execution.securecodebox.io             2020-10-14T09:32:19Z
scheduledscans.execution.securecodebox.io        2020-10-14T09:32:19Z
```

To delete these CRDs you can execute the following command:

```bash
kubectl delete crd cascadingrules.cascading.securecodebox.io \
parsedefinitions.execution.securecodebox.io \
scancompletionhooks.execution.securecodebox.io \
scans.execution.securecodebox.io \
scantypes.execution.securecodebox.io \
scheduledscans.execution.securecodebox.io
```

### Delete Volumes

Some Resources like the elastic stack require a persistent volume.
To list all persistent volumes in the default namespace you can execute:

```bash {1}
kubectl get pvc
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                                                 STORAGECLASS   REASON   AGE
pvc-6002bffb-51ac-4767-a5a8-9f8834ffa7ec   30Gi       RWO            Delete           Bound    default/elasticsearch-master-elasticsearch-master-0   standard                3h30m
```

To delete a persistent volume you can execute:

```bash
kubectl delete pvc pvc-6002bffb-51ac-4767-a5a8-9f8834ffa7ec 
```

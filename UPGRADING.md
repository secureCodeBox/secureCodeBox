# Upgrading

## From 2.X to 3.X

### Renamed `lurcher` to `lurker`

In the 3.0 release, we corrected the misspelling in `lurcher`. To remove the remains after upgrade, delete the old service accounts and roles from the namespaces where you have executed scans in the past:

```bash
# Find relevant namespaces
kubectl get serviceaccounts --all-namespaces | grep lurcher

# Delete role, role binding and service account for the specific namespace 
kubectl --namespace <NAMESPACE> delete serviceaccount lurcher
kubectl --namespace <NAMESPACE> delete rolebindings lurcher
kubectl --namespace <NAMESPACE> delete role lurcher
```

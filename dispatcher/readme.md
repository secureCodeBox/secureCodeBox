## CRD Experiments

```bash
# Build Operator Image
docker build -t j12934/test:operator . && docker push j12934/test:operator

# Deploy crd experiment
k apply -f crd.yaml

# Deploy sample nmap ScanJobDefinition
k apply -f nmap-scanjob-definition.yaml

# Deploy "Operator" / Dispatcher Deployments
k apply -f operator-deployment.yaml
```

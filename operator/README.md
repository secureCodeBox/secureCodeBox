![operator logo](https://docs.securecodebox.io/img/Logo_Color.svg)

The secureCodeBox operator is running on kubernetes and the core component of the complete secureCodeBox stack, responsible for managing all scans and resources.

<!-- end -->

## Deployment

The secureCodeBox Operator can be deployed via helm:

```bash
# Add the secureCodeBox Helm Repo
helm repo add secureCodeBox https://charts.securecodebox.io
# Create a new namespace for the secureCodeBox Operator
kubectl create namespace securecodebox-system
# Install the Operator & CRD's
helm install securecodebox-operator secureCodeBox/operator
```

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| customCACertificate.certificate | string | `"public.crt"` |  |
| customCACertificate.existingCertificate | string | `"ca-certs"` |  |
| image.pullPolicy | string | `"Always"` | Image pull policy |
| image.repository | string | `"docker.io/securecodebox/operator"` | The operator image repository |
| image.tag | string | defaults to the charts version | Parser image tag |
| lurcher.image.pullPolicy | string | `"Always"` | Image pull policy |
| lurcher.image.repository | string | `"docker.io/securecodebox/lurcher"` | The operator image repository |
| lurcher.image.tag | string | defaults to the charts version | Parser image tag |
| minio.defaultBucket.enabled | bool | `true` |  |
| minio.defaultBucket.name | string | `"securecodebox"` |  |
| minio.enabled | bool | `true` |  |
| minio.resources.requests.memory | string | `"256Mi"` |  |
| minio.tls.certSecret | string | `"minio-tls"` |  |
| minio.tls.enabled | bool | `true` |  |
| resources | object | `{"limits":{"cpu":"100m","memory":"30Mi"},"requests":{"cpu":"100m","memory":"20Mi"}}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| s3.authType | string | `"access-secret-key"` | Authentication method. Supports access-secret-key (used by most s3 endpoint) and aws-irsa (Used by AWS EKS IAM Role to Kubenetes Service Account Binding. Support for AWS IRSA is considered experimental in the secureCodeBox) |
| s3.awsStsEndpoint | string | `"https://sts.amazonaws.com"` | STS Endpoint used in AWS IRSA Authentication. Change this to the sts endpoint of your aws region. Only used when s3.authType is set to "aws-irsa" |
| s3.bucket | string | `"my-bucket"` |  |
| s3.enabled | bool | `false` |  |
| s3.endpoint | string | `"fra1.digitaloceanspaces.com"` |  |
| s3.keySecret | string | `"my-secret"` |  |
| s3.port | string | `nil` |  |
| s3.secretAttributeNames.accesskey | string | `"accesskey"` |  |
| s3.secretAttributeNames.secretkey | string | `"secretkey"` |  |
| securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the operator container. They are not required |
| securityContext.privileged | bool | `false` | Ensures that the operator container is not run in privileged mode |
| securityContext.readOnlyRootFilesystem | bool | `true` | Prevents write access to the containers file system |
| securityContext.runAsNonRoot | bool | `true` | Enforces that the Operator image is run as a non root user |
| telemetryEnabled | bool | `true` | The Operator sends anonymous telemetry data, to give the team an overview how much the secureCodeBox is used. Find out more at https://www.securecodebox.io/telemetry |


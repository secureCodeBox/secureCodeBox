---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Installation"
sidebar_label: Installation
sidebar_position: 1
path: "docs/getting-started/installation"
---

The secureCodeBox is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. For your first steps Kubernetes from [Docker Desktop](https://www.docker.com/products/docker-desktop), [Minikube](https://minikube.sigs.k8s.io/docs/) or [KIND](https://kind.sigs.k8s.io/) is sufficient.

First of all you need to install the secureCodeBox Operator which is responsible for starting all security scans.

```bash
# Install the Operator & CRD's into the `securecodebox-system` namespace
helm --namespace securecodebox-system upgrade --install --create-namespace securecodebox-operator oci://ghcr.io/securecodebox/helm/operator
```

If you didn't see any errors you now have the secureCodeBox Operator up and running! 🥳 🚀

You're now ready to install your [first scan types and start your first scans](/docs/getting-started/first-scans).

## Supported Kubernetes Version

The secureCodeBox supports the 4 latest Kubernetes releases (`v1.34`, `v1.33`, `v1.32` & `v1.31`). Older versions might also work but are not officially supported or tested.

## Accessing the included MinIO Instance

:::warning Development/Quickstart Only
The included MinIO instance is intended **only for development, testing, and quickstart purposes**. For production environments, you should use either:
- A managed S3-compatible storage service from your cloud provider (AWS S3, Google Cloud Storage, etc.)
- An externally managed MinIO instance (e.g., via the MinIO Operator)

This provides better reliability, scalability, and security compared to the embedded MinIO instance.
:::

The default secureCodeBox Operator includes a [MinIO](https://min.io/) instance, which acts as a local S3 filestorage API used by the secureCodeBox to store the results files of its scans. You can switch it out with a S3 compatible API provided by most cloud providers.

You can access the MinIO instance included in the default installation like the following:

Port Forward MinIO UI: `kubectl port-forward -n securecodebox-system service/securecodebox-operator-minio 9000:9001`

- AccessKey (Username): `kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.root-user}' | base64 --decode; echo`
- SecretKey (Password): `kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.root-password}' | base64 --decode; echo`

:::note
If you are using Windows, do not include the `| base64 --decode; echo` part in the Command Prompt. Instead, after running the command, manually decode the resulting base64 output using PowerShell.
:::

Then open your browser on [http://localhost:9000](http://localhost:9000) and login in with the credentials returned by the command listed above.

If you find yourself running these snippets regularly, you might want to check out this [helper script](https://github.com/secureCodeBox/secureCodeBox/blob/main/bin/minio-port-forward.sh)

## Operator Configuration Options

### Using a hosted S3 Buckets as storage backend (Recommended for Production)

For production environments, it is **strongly recommended** to replace the default MinIO instance with a managed S3-compatible storage service from your cloud provider. This provides better reliability, scalability, security, and backup capabilities.

To change out the default MinIO instance with a S3 Bucket from a cloud provider you can update the helm values to connect the operator with you S3 bucket.

#### AWS S3 Buckets

```yaml
minio:
  # disable the local minio instance
  enabled: false
s3:
  enabled: true
  # update the region to match the location of your bucket
  endpoint: "s3.eu-west-1.amazonaws.com"
  bucket: "your-own-securecodebox-bucket-name"
  # Name to a k8s secret with 'accesskey' and 'secretkey' as attributes in the same namespace as this release
  # Example creation via kubectl:
  # kubectl create secret generic securecodebox-s3-credentials --from-literal=accesskey="******" --from-literal=secretkey="******"
  keySecret: securecodebox-s3-credentials
```

:::info
Instead of using access keys, it is possible to use [EKS Pod Identities](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html) or [IRSA](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) in secureCodeBox to authenticate to the S3 bucket using short-lived, automatically rotated credentials. 

However, because these credentials are short-lived (maximum lifetime of 12 hours), scans started by the operator in this setup are limited in their maximum duration. The tokens are automatically rotated when they reach 20% of their remaining lifetime. This means:

- In the worst-case scenario, a scan might start right before a token rotation occurs
- At this point, the current token has approximately 2.4 hours remaining (20% of 12 hours)
- The scan will use this current token for its entire duration
- If the scan runs longer than 2.4 hours, it will complete successfully but fail when attempting to save results to S3 because the token has expired

Therefore, scans must complete within 2.4 hours to ensure results can be persisted to S3. Depending on the expected scan duration in your setup, this limitation can pose a problem. See: [Issue secureCodeBox/secureCodeBox#2255](https://github.com/secureCodeBox/secureCodeBox/issues/2255)

<details>
  <summary>Example Pod Identity Setup (recommended over IRSA)</summary>

  Terraform/OpenTofu setup for the IAM Role & Policy:
  ```tf
  resource "aws_iam_policy" "securecodebox_s3_policy" {
    name        = "securecodebox-s3-${var.bucket_name}-access"
    description = "IAM policy for secureCodeBox to access S3 bucket ${var.bucket_name}"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:GetObjectVersion",
            "s3:PutObjectAcl",
            "s3:GetObjectAcl"
          ]
          Resource = [
            "arn:aws:s3:::${var.bucket_name}/*"
          ]
        },
        {
          Effect = "Allow"
          Action = [
            "s3:ListBucket",
            "s3:GetBucketLocation",
            "s3:GetBucketVersioning"
          ]
          Resource = [
            "arn:aws:s3:::${var.bucket_name}"
          ]
        }
      ]
    })
  }

  # IAM Role for secureCodeBox with EKS Pod Identity
  resource "aws_iam_role" "securecodebox_role" {
    name = "securecodebox-role"

    max_session_duration = 12 * 60 * 60 // 12h, session duration needs to be this long to allow the operator to create presigned urls with a longer lifetime

    # Use EKS Pod Identity for the operator service account.
    assume_role_policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Principal = {
            Service = "pods.eks.amazonaws.com"
          }
          Action = [
            "sts:AssumeRole",
            "sts:TagSession"
          ]
        }
      ]
    })
  }

  # Attach the S3 policy to the role
  resource "aws_iam_role_policy_attachment" "securecodebox_s3_policy_attachment" {
    role       = aws_iam_role.securecodebox_role.name
    policy_arn = aws_iam_policy.securecodebox_s3_policy.arn
  }

  # Create EKS Pod Identity Association
  resource "aws_eks_pod_identity_association" "securecodebox_operator" {
    cluster_name    = var.cluster_name
    namespace       = "securecodebox-system"
    service_account = "securecodebox-operator"
    role_arn        = aws_iam_role.securecodebox_role.arn
  }
  ```

  secureCodeBox Operator values:

  ```yaml
  minio:
    enabled: false
  s3:
    enabled: true
    authType: "aws-iam"
    bucket: <your-bucket-name>
    endpoint: "s3.<your-region>.amazonaws.com"
  ```
</details>

<details>
  <summary>Example IRSA Setup</summary>

  Terraform/OpenTofu setup for the IAM Role & Policy:
  ```tf
  resource "aws_iam_policy" "securecodebox_s3_policy" {
    name        = "securecodebox-s3-${var.bucket_name}-access"
    description = "IAM policy for secureCodeBox to access S3 bucket ${var.bucket_name}"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:GetObjectVersion",
            "s3:PutObjectAcl",
            "s3:GetObjectAcl"
          ]
          Resource = [
            "arn:aws:s3:::${var.bucket_name}/*"
          ]
        },
        {
          Effect = "Allow"
          Action = [
            "s3:ListBucket",
            "s3:GetBucketLocation",
            "s3:GetBucketVersioning"
          ]
          Resource = [
            "arn:aws:s3:::${var.bucket_name}"
          ]
        }
      ]
    })
  }

  # IAM Role for secureCodeBox with EKS Pod Identity
  resource "aws_iam_role" "securecodebox_role" {
    name = "securecodebox-role"

    max_session_duration = 12 * 60 * 60 // 12h, session duration needs to be this long to allow the operator to create presigned urls with a longer lifetime

    # Use IRSA (IAM Roles for Service Accounts) via the cluster OIDC provider.
    # The cluster OIDC issuer is available from the data.aws_eks_cluster.cluster data source.
    # The Federated principal is the cluster's OIDC provider ARN in the account.
    assume_role_policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Principal = {
            Federated = "arn:aws:iam::${var.aws_account_id}:oidc-provider/${var.oidc_provider}"
          }
          Action = "sts:AssumeRoleWithWebIdentity"
          Condition = {
            StringEquals = {
              "${var.oidc_provider}:sub" = "system:serviceaccount:securecodebox-system:securecodebox-operator"
            }
          }
        }
      ]
    })
  }

  # Attach the S3 policy to the role
  resource "aws_iam_role_policy_attachment" "securecodebox_s3_policy_attachment" {
    role       = aws_iam_role.securecodebox_role.name
    policy_arn = aws_iam_policy.securecodebox_s3_policy.arn
  }
  ```

  secureCodeBox Operator values:

  ```yaml
  minio:
    enabled: false
  s3:
    enabled: true
    authType: "aws-iam"
    bucket: <your-bucket-name>
    endpoint: "s3.<your-region>.amazonaws.com"
  serviceAccount:
    annotations:
      eks.amazonaws.com/role-arn: <ARN of the IAM Role created by terraform>
  ```
</details>
:::

#### Google Cloud Storage

```yaml
minio:
  # disable the local minio instance
  enabled: false
s3:
  enabled: true
  bucket: your-own-securecodebox-bucket-name
  endpoint: storage.googleapis.com
  # Name to a k8s secret with 'accesskey' and 'secretkey' as attributes in the same namespace as this release
  # Example creation via kubectl:
  # kubectl create secret generic gcs-bucket-credentials --from-literal=accesskey="******" --from-literal=secretkey="******"
  keySecret: gcs-bucket-credentials
```

### Prometheus Metrics

If you want to monitor the scans managed by your _secureCodeBox Operator_ you can use the [Prometheus](https://prometheus.io/) metrics that the operator provides.
To use them you need to configure your prometheus instance to scrape these metrics from port 8080 of the operator pod.

If you are using the Prometheus operator you can enable metric collection by enabling the service monitoring included in the operators helm chart.
To do that you need to set the `metrics.serviceMonitor.enabled` flag to `true`.

```bash
helm --namespace securecodebox-system upgrade --install --create-namespace securecodebox-operator oci://ghcr.io/securecodebox/helm/operator --set="metrics.serviceMonitor.enabled=true"
```

Custom metrics from the _secureCodeBox Operator_ are prefixed with: `securecodebox_`.
You can list them, together with an explanation in your Prometheus/Grafana explore view.

## Install SCB Scanner

The following list will give you a short overview of all supported security scanner charts and how to install them.
You will find a more detailed documentation for each scanner in our _Scanners_ documentation section.

:::note
If you are installing the secureCodeBox the first time we recommend to read the [first scans](/docs/getting-started/first-scans) documentation first.
:::

You can optionally deploy SCB scanner charts for each security scanner you want to use. They should not be installed into the securecodebox-system namespace like the operator, but into the individual namespaces where you want to run the scans.

```bash
# The following chart will be installed in the `default` namespace by you can choose the namespace of your choice by
# adding `--namespace YOURNAMESPACE` to each line
helm upgrade --install gitleaks oci://ghcr.io/securecodebox/helm/gitleaks
helm upgrade --install kube-hunter oci://ghcr.io/securecodebox/helm/kube-hunter
helm upgrade --install nikto oci://ghcr.io/securecodebox/helm/nikto
helm upgrade --install nmap oci://ghcr.io/securecodebox/helm/nmap
helm upgrade --install ssh-audit oci://ghcr.io/securecodebox/helm/ssh-audit
helm upgrade --install sslyze oci://ghcr.io/securecodebox/helm/sslyze
helm upgrade --install subfinder oci://ghcr.io/securecodebox/helm/subfinder
helm upgrade --install trivy oci://ghcr.io/securecodebox/helm/trivy
helm upgrade --install wpscan oci://ghcr.io/securecodebox/helm/wpscan
helm upgrade --install zap-automation-framework oci://ghcr.io/securecodebox/helm/zap-automation-framework
```

## Install some demo targets

If you want to test some of the security scanners within your namespace you can use some demo targets.

:::danger
As these demo targets are intentionally vulnerable you shouldn't expose them to the internet - keep them internal.
Otherwise you could be targeted by someone else really fast 😈
:::

```bash
helm upgrade --install dummy-ssh oci://ghcr.io/securecodebox/helm/dummy-ssh
helm upgrade --install bodgeit oci://ghcr.io/securecodebox/helm/bodgeit
helm upgrade --install juice-shop oci://ghcr.io/securecodebox/helm/juice-shop
helm upgrade --install old-wordpress oci://ghcr.io/securecodebox/helm/old-wordpress
helm upgrade --install swagger-petstore oci://ghcr.io/securecodebox/helm/swagger-petstore
```

:::note
These charts will be installed in the `default` namespace, but you can choose the namespace of your choice by adding `--namespace YOURNAMESPACE` to each helm command.
:::

## Troubleshooting

### MinIO Startup Problems

If your secureCodeBox Operator install is failing, and you see that the operator pod seems to be working okay, but the MinIO pods started alongside it does not start up properly, your cluster probably isn't configured to have a working default [Storage Class for Persistent Volumes](https://kubernetes.io/docs/concepts/storage/storage-classes/).

Suggested solutions:

- Use a Cloud Storage provider instead of MinIO. This has to provide a API compatible to AWS S3. Providers that we have tried and worked great include:
  - AWS S3
  - Google Cloud Storage
  - DigitalOcean Spaces
- Configure MinIO to use a HostPath Volume. This is more work to set up and manage, but also works for local / on-prem installation.

### ClusterRole & CRD Issues

The secureCodeBox Operator Helm Chart contains Custom Resource Definitions and ClusterRoles which is usually reserved to administrators of production cluster (and rightfully so 😄). If you are just testing out the secureCodeBox consider using a local Kubernetes Cluster with tools like [kind](https://kind.sigs.k8s.io/), [minikube](https://minikube.sigs.k8s.io/docs/) or [Docker Desktops (Mac/Windows) Kubernetes cluster](https://www.docker.com/products/kubernetes).

### Running on Windows

There are multiple ways to install Kubernetes and Helm to run secureCodeBox on Windows. One easy method is to install [Docker Desktop](https://www.docker.com/products/docker-desktop) then enable Kubernetes in the Settings. While installing a current version of Docker Desktop you will be prompted to install Linux Subsystem for Windows (WSL2). Now you can continue the installation on either Windows or the Linux Subsystem.

- For Windows: Install [Helm](https://helm.sh) for Windows like instructed on the website. Usually installing from Binaries will be easy.
- For Linux Subsystem: Install the Linux Distribution of your choice from the Microsoft Store (Ubuntu 18.04 works fine). Now install [Helm](https://helm.sh) for the chosen Distribution (e.g. using Apt for Ubuntu).

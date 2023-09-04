---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: scanner (Directory)
sidebar_position: 5
---

If it is not possible to use the official Docker Image of your scanner (e.g. there is no official repository) you will need to create a `scanner` directory containing a Dockerfile and maybe a `wrapper.sh`.

## Dockerfile

The Dockerfile should be minimal and based on the official _alpine_ baseimage.
Please make sure to add a new user for your scanner.
Please change the user using `UID`. This enables the Image to run in clusters which have a strict `runAsNonRoot` policy (See [Pod Security Policies | Kubernetes](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#users-and-groups)).
Use the Docker build argument `scannerVersion` to retrieve a specific version of your scanner.
`scannerVersion` should be populated by your scanner's chart `AppVersion` field (see [Local Deployment](/docs/contributing/local-deployment)).
A Docker image for nmap would look the following:

```dockerfile
FROM alpine:3.12
ARG scannerVersion=latest
RUN apk add --no-cache nmap=$scannerVersion nmap-scripts=$scannerVersion
RUN addgroup --system --gid 1001 nmap && adduser nmap --system --uid 1001 --ingroup nmap
USER 1001
CMD [nmap]
```

See [Local Deployment](/docs/contributing/local-deployment) for instructions on how to build and deploy your scanner.

## wrapper.sh

Sometimes it will be necessary to wrap the scanner e.g. the scanner returns bad exit codes when they identify findings.
This would cause the Kubernetes jobs to fail even thought the scanner has actually run successfully, after all it's "their job" to identify findings.
Please provide this script as `wrapper.sh` and use it as `CMD` value in your Dockerfile.

Furthermore, note that the scanner should output the findings to `/home/securecodebox/<your_scanner>.<filetype>`. This should be the same as in `ScanType` `Spec.ExtractResults.Location`. Please take a look at [ScanType | secureCodeBox](/docs/api/crds/scan-type) on how to configure your `ScanType`. Outputting results to a file is usually specified as a command line option to your scanner (e.g. `nmap -oX file.xml`), but in the case that the scanner does not provide such an options, you could write the wrapper as follows:

```shell
python scanner.py "$@" 1> /home/securecodebox/<your_scanner>.<filetype>
```

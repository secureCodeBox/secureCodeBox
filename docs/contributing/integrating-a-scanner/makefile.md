---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Makefile
sidebar_position: 4
---

To test your scanner locally, you may use the following makefile.

```makefile
#!/usr/bin/make -f

include_guard = set                 # Always include this line (checked in the makefile framework)
scanner = angularjs-csti-scanner    # The name of your scanner
custom_scanner = set                # Include this line if your scanner has a dockerfile

include ../../scanners.mk           # Ensures that all the default makefile targets are included
```

See [Local Deployment](/docs/contributing/local-deployment) for examples how to use the Makefiles.

## Available makefile targets

| Target                            | Use                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| reset-integration-tests-namespace | Resets the integration-tests namespace                                               |
| unit-tests                        | Run your parser unit tests                                                           |
| docker-build                      | Builds your parser (& scanner)                                                       |
| docker-export                     | Exports your parser (& scanner) into a .tar file                                     |
| kind-import                       | Loads your parser (& scanner) .tar files into your local kind cluster                |
| deploy                            | Deploys your scanner helm chart into your local kind cluster                         |
| deploy-test-deps                  | Deploys your scanner's test dependencies (demo-targets) into your local kind cluster |
| integration-tests                 | Deletes all scans and runs your integration test `scanners/SCANNER_NAME.test.js`     |

## Configuring your makefile (examples)

### Adding test dependencies (demo-targets)

```makefile
#!/usr/bin/make -f

include_guard = set
scanner = wpscan

include ../../scanners.mk

deploy-test-deps: deploy-test-dep-old-wordpress
```

This adds the old-wordpress demo-target to your integration tests. You can find all available demo-targets in `common.mk`.

### Overriding helm deploy configurations

```makefile
#!/usr/bin/make -f
include_guard = set
scanner = kubeaudit
custom_scanner = set

include ../../scanners.mk

deploy-with-scanner:
	@echo ".: 💾 Deploying custom '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(scanner)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(scanner)" \
		--set="scanner.image.tag=$(IMG_TAG)" \
		--set="kubeauditScope=cluster"

deploy-test-deps:
	# If not exists create namespace where the tests will be executed
	kubectl create namespace kubeaudit-tests --dry-run=client -o yaml | kubectl apply -f -
	# Install jshop in kubeaudit-tests namespace
	helm -n kubeaudit-tests upgrade --install juice-shop ../../demo-targets/juice-shop/ --wait
```

This makefile overrides the deploy-with-scanner target such that the `kubeauditScope` can be overwritten.
Furthermore, it overrides the deploy-test-deps target such that juice-shop is installed in the correct namespace (kubeaudit-tests).

### Reusing components from other scanners

```makefile
#!/usr/bin/make -f

include_guard = set
scanner = zap-advanced
custom_scanner = set

include ../../scanners.mk

unit-tests:
	@$(MAKE) -s unit-test-py

unit-tests-parser:
	$(MAKE) -s -f ../../scanners.mk unit-tests-parser include_guard=set scanner=zap

install-deps:
	cd ../zap/ && $(MAKE) -s install-deps

docker-build-parser:
	cd ../zap/ && $(MAKE) -s docker-build-parser

docker-export-parser:
	cd ../zap/ && $(MAKE) -s docker-export-parser

kind-import-parser:
	cd ../zap/ && $(MAKE) -s kind-import-parser

deploy-with-scanner:
	@echo ".: 💾 Deploying custom '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-zap" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(scanner)" \
		--set="scanner.image.tag=$(IMG_TAG)"

deploy-test-deps: deploy-test-dep-nginx deploy-test-dep-bodgeit deploy-test-dep-juiceshop deploy-test-dep-petstore
```

Zap-advanced reuses the parser container from zap scanner, thus in the makefile, we overwrite the targets for parser build so that they reference the makefile from zap.

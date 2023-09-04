---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Makefile
sidebar_position: 4
---

To test your hook locally, you may use the following makefile.

```makefile
#!/usr/bin/make -f

include_guard = set
hook = finding-post-processing

include ../../hooks.mk
```

See [Local Deployment](/docs/contributing/local-deployment) for examples how to use the Makefiles.

## Available makefile targets

| Target                            | Use                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------- |
| reset-integration-tests-namespace | Resets the integration-tests namespace                                            |
| unit-tests                        | Run your hook unit tests                                                          |
| docker-build                      | Builds your hook                                                                  |
| docker-export                     | Exports your hook into a .tar file                                                |
| kind-import                       | Loads your hook .tar files into your local kind cluster                           |
| deploy                            | Deploys your hook helm chart into your local kind cluster                         |
| deploy-test-deps                  | Deploys your hook's test dependencies (demo-targets) into your local kind cluster |
| integration-tests                 | Deletes all scans and runs your integration test `scanners/SCANNER_NAME.test.js`  |

## Configuring your makefile (examples)

### Adding test dependencies (demo-targets)

```makefile
#!/usr/bin/make -f

include_guard = set
hook = generic-webhook

include ../../hooks.mk


deploy-test-deps: deploy-test-dep-http-webhook deploy-test-dep-test-scan

deploy:
	@echo ".: 💾 Deploying '$(name)' $(hook-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install ro-hook . \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)" \
		--set="webhookUrl=http://http-webhook/hallo-welt"

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd ../../tests/integration/ && npm ci &&	npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests generic/read-only-write-hook.test.js

```

This adds the http-webhook demo-target to your integration tests.
`deploy-test-dep-test-scan` is a sample scanner used in most hook integration tests.

The above makefile also overrides the `integration-test` target such that it references the generic folder as a test suite.

### Changing the unit test language

```makefile
#!/usr/bin/make -f

include_guard = set
hook = persistence-defectdojo

include ../../hooks.mk

unit-tests:
	@$(MAKE) -s unit-test-java
```

You can choose from: `unit-test-js` `unit-test-py` `unit-test-java`.

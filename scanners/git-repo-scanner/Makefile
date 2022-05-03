#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = git-repo-scanner
custom_scanner = set

include ../../scanners.mk

unit-tests:
	@$(MAKE) -s unit-test-py

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	@echo "Disabled due to performance."
	#kubectl -n integration-tests delete scans --all
	#cd ../../tests/integration/ && npm ci
	#cd ../../scanners/${scanner}
	#npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests ${scanner}/integration-tests

deploy-without-scanner:
	rm -rf venv # delete venv. Otherwise it would be deployed with zap
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
    --set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
    --set-string="parser.env[0].value=true"

deploy-with-scanner:
	rm -rf venv # delete venv. Otherwise it would be deployed with zap
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
    --set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
    --set-string="parser.env[0].value=true" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(name)" \
		--set="scanner.image.tag=$(IMG_TAG)"
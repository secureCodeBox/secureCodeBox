#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = sslyze

include ../../scanners.mk

deploy-test-deps: deploy-test-dep-unsafe-https

deploy-without-scanner:
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
    --set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
    --set-string="parser.env[0].value=true"

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd ../../tests/integration/ && npm ci
	cd ../../scanners/${scanner}
	npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests ${scanner}/integration-tests

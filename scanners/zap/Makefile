#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = zap

include ../../scanners.mk

deploy-test-deps: deploy-test-dep-nginx

deploy-without-scanner:
	helm -n integration-tests install zap ./  --wait \
    --set="parser.image.tag=sha-$$(git rev-parse --short HEAD)" \
    --set="parser.image.repository=docker.io/${IMG_NS}/parser-zap" \
    --set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
    --set-string="parser.env[0].value=true"


integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd ../../tests/integration/ && npm ci
	cd ../../scanners/${scanner}
	npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests ${scanner}/integration-tests

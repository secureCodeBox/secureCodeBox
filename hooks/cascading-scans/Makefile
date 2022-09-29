#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
hook = cascading-scans

test_files = [hook.test.js, kube.test.js]

include ../../hooks.mk

# Deploys dependencies for both the nmap-ncrack test and the nmap-sslyze test
.PHONY: deploy-test-deps 
deploy-test-deps: deploy-test-deps-1 deploy-test-deps-2

.PHONY: test-2
test-2: | clean-integration-tests unit-tests docker-build docker-export kind-import deploy deploy-test-deps-2 integration-tests-2

.PHONY: deploy-test-dep-nmap
deploy-test-dep-nmap:
	cd 	$(SCANNERS_DIR)/nmap/ && $(MAKE) -s docker-build docker-export kind-import && \
	helm -n integration-tests upgrade --install nmap . \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-nmap" \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-nmap" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true" \
		--set="cascadingRules.enabled=true"

.PHONY: deploy-test-dep-ncrack
deploy-test-dep-ncrack:
	printf "root\nadmin\n" > users.txt
	printf "THEPASSWORDYOUCREATED\n123456\npassword\n" > passwords.txt
	kubectl create secret generic --from-file users.txt --from-file passwords.txt ncrack-lists -n integration-tests --dry-run=client -o yaml | kubectl apply -f -
	cd $(SCANNERS_DIR)/ncrack/ && $(MAKE) -s docker-build docker-export kind-import && \
	helm -n integration-tests upgrade --install ncrack . \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-ncrack" \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-ncrack" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true" \
		--set="scanner.extraVolumes[0].name=ncrack-lists" \
		--set="scanner.extraVolumes[0].secret.secretName=ncrack-lists" \
		--set="scanner.extraVolumeMounts[0].name=ncrack-lists" \
		--set="scanner.extraVolumeMounts[0].mountPath=/ncrack/" \
		--set="cascadingRules.enabled=true"

.PHONY: deploy-test-dep-sslyze
deploy-test-dep-sslyze:
	cd $(SCANNERS_DIR)/sslyze/ && $(MAKE) -s docker-build docker-export kind-import && \
	helm -n integration-tests upgrade --install sslyze . --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-sslyze" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true" \
		--set="cascadingRules.enabled=true"

.PHONY: deploy-test-deps-1 # Deploys dependencies for the nmap-ncrack test
deploy-test-deps: deploy-test-dep-dummy-ssh deploy-test-dep-nmap deploy-test-dep-ncrack

.PHONY: deploy
deploy:
	@echo ".: 💾 Deploying '$(name)' $(hook-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'cascading-scans'."
	helm -n integration-tests upgrade --install dssh . --wait \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)"

.PHONY: deploy-test-deps-2	# Deploys dependencies for the nmap-sslyze test	
deploy-test-deps-2: deploy-test-dep-unsafe-https deploy-test-dep-nmap deploy-test-dep-sslyze
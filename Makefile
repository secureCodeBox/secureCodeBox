# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

include ./env-paths.mk

all: help

.PHONY: npm-ci-all
npm-ci-all: ## Runs npm ci in all node module subfolders.
	@echo "Installing all NPM dependencies"
	@for package in $(PACKAGE_JSON_LIST); do \
		echo "🧱 Installing dependencies for $${package}" && cd $$(dirname $${package}) && npm ci; \
	done

.PHONY: npm-test-all
npm-test-all: ## Runs all Jest based test suites.
	npm test -- --ci --colors --coverage --testPathIgnorePatterns /integration-tests/

.PHONY: test-all
test-all: install-operator install-sdks ## Runs all makefile based test suites (unit + integration Tests).
	@echo "Running make test for all scanner and hook modules..."
	@for dir in $(SCANNERS_TEST_LIST) $(HOOKS_TEST_LIST); do \
    	echo "🧪 Test Suite for $${dir}" && cd  $$(dirname $$dir) && 	$(MAKE) -s test || exit 1; \
	done

.PHONY: install-operator
install-operator: ## Install the operator for makefile based testing.
	@echo "Installing the operator for makefile based testing..."
	cd $(OPERATOR_DIR) && $(MAKE) -s docker-build docker-export kind-import helm-deploy

.PHONY: install-sdks
install-sdks: ## Install the SDKs for makefile based testing.
	@echo "Installing the SDKs (parser, hooks) for makefile based testing..."
	cd $(PARSER_SDK_DIR) && $(MAKE) -s docker-build
	cd $(HOOK_SDK_DIR) && $(MAKE) -s docker-build

.PHONY: readme
readme:	## Generate README.md based on Chart.yaml and template.
	$(BIN_DIR)/generate-helm-docs.sh --readme $(PROJECT_DIR) $(HELM_DOCS_DIR)

.PHONY: hook-docs
hook-docs: ## Generate documentation for hooks.
	@for chart in $(HOOKS_CHART_LIST); do \
		$(BIN_DIR)/generate-helm-docs.sh --hook $${chart} $(HELM_DOCS_DIR); \
	done

.PHONY: scanner-docs
scanner-docs: ## Generate documentation for scanners.
	@for chart in $(SCANNERS_CHART_LIST); do \
		$(BIN_DIR)/generate-helm-docs.sh --scanner $${chart} $(HELM_DOCS_DIR); \
	done

.PHONY: operator-docs
operator-docs: ## Generate documentation for the operator.
	$(BIN_DIR)/generate-helm-docs.sh --operator $(OPERATOR_DIR)/Chart.yaml $(HELM_DOCS_DIR)

.PHONY: auto-discovery-docs
auto-discovery-docs: ## Generate documentation for the auto-discovery.
	$(BIN_DIR)/generate-helm-docs.sh --operator $(AUTO_DISCOVERY_DIR)/kubernetes/Chart.yaml $(HELM_DOCS_DIR)

.PHONY: demo-target-docs
demo-target-docs: ## Generate documentation for demo targets.
	@for chart in $(DEMO_TARGETS_CHART_LIST); do \
		$(BIN_DIR)/generate-helm-docs.sh --demo-target $${chart} $(HELM_DOCS_DIR); \
	done

.PHONY: docs
docs: readme hook-docs scanner-docs operator-docs auto-discovery-docs demo-target-docs ## Generate all documentation.

.PHONY: create-new-scanner
create-new-scanner: ## Creates templates for a new scanner, pass NAME=NEW-SCANNER to this target.
ifdef NAME
	rm -rf $(SCANNERS_DIR)/$(NAME)
	cp -r $(TEMPLATES_DIR)/new-scanner/ $(SCANNERS_DIR)/$(NAME)
	find $(SCANNERS_DIR)/$(NAME) -type f ! -name tmp \
		-exec sed -n s/new-scanner/$(NAME)/g;w $(SCANNERS_DIR)/$(NAME)/tmp {} \; \
		-exec mv $(SCANNERS_DIR)/$(NAME)/tmp {} \;
	mv $(SCANNERS_DIR)/$(NAME)/templates/new-scanner-parse-definition.yaml \
		$(SCANNERS_DIR)/$(NAME)/templates/$(NAME)-parse-definition.yaml
	mv $(SCANNERS_DIR)/$(NAME)/templates/new-scanner-scan-type.yaml \
		$(SCANNERS_DIR)/$(NAME)/templates/$(NAME)-scan-type.yaml
else
	@echo "Scanner name not defined, please provide via make create-new-scanner NAME=NEW-SCANNER"
endif

.PHONY: help
help: ## Display this help screen.
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'	

test-scanner:
	make test -C $(SCANNERS_DIR)/$(target)
test-hook:
	make test -C $(HOOKS_DIR)/$(target)		
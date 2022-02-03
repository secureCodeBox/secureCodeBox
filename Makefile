# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

PROJECT_DIR		= $(shell pwd)
BIN_DIR				= $(PROJECT_DIR)/bin
SCANNERS_DIR	= $(PROJECT_DIR)/scanners
HOOKS_DIR			= $(PROJECT_DIR)/hooks
HELM_DOCS_DIR	= $(PROJECT_DIR)/.helm-docs

SCANNERS_CHART_LIST	:= $(sort $(wildcard $(SCANNERS_DIR)/*/Chart.yaml))
HOOKS_CHART_LIST		:= $(sort $(wildcard $(HOOKS_DIR)/*/Chart.yaml))

all: help

.PHONY: npm-ci-all
npm-ci-all: ## Runs npm ci in all node module subfolders.
# This find construct is based on https://stackoverflow.com/questions/4210042/how-to-exclude-a-directory-in-find-command/4210072#4210072
	find . \( \
		-name '.git' -o \
		-name '.github' -o \
		-name '.idea' -o \
		-name '.reuse' -o \
		-name '.vagrant' -o \
		-name '.vscode' -o \
		-name 'bin' -o \
		-name 'docs' -o \
		-name 'LICENSES' -o \
		-name 'coverage' -o \
		-name 'dist' -o \
		-name 'node_modules' -o \
		-name target \) \
		-prune \
		-false \
		-o -type f \
		-iname package.json \
		-execdir npm ci \;

.PHONY: npm-test-all
npm-test-all: ## Runs all Jest based test suites.
	npm test -- --testPathIgnorePatterns "/integration-tests/"

.PHONY: test-all
test-all: ## Runs all makefile based test suites.
	@echo ".: ⚙ Installing the operator for makefile based testing."
	cd ./operator && $(MAKE) -s docker-build docker-export kind-import helm-deploy
	@echo ".: ⚙ Running make test for all scanner and hook modules."
	for dir in scanners/*/ hooks/*/ ; do \
  	cd $$dir; \
		echo ".: ⚙ Running make test for '$$dir'."; \
  	$(MAKE) -s test || exit 1 ; \
		cd -; \
	done;

.PHONY: readme
readme:	## Generate README.md based on Chart.yaml and template.
	@echo ".: ⚙ Generate Helm Docs."
	helm-docs --template-files=$(HELM_DOCS_DIR)/templates.gotmpl --template-files=.helm-docs.gotmpl --template-files=$(HELM_DOCS_DIR)/README.md.gotmpl

# FIXME: #754 Remove .ONESHELL which is unsupported on some systems
.PHONY: hook-docs
hook-docs: ## Generate documentation for hooks.
	cd hooks; \
	find . -type f ! -name "$(printf "*\n*")" -name Chart.yaml | while IFS= read -r chart; do \
	(dir="$$(dirname "$${chart}")"; \
		echo "Processing Helm Chart in $$dir"; \
		cd "$${dir}" || exit; \
		if [ -d "docs" ]; then \
			echo "Docs Folder found at: $${dir}/docs"; \
			helm-docs \
				--template-files="$(HELM_DOCS_DIR)/templates.gotmpl" \
				--template-files=".helm-docs.gotmpl" \
				--template-files="$(HELM_DOCS_DIR)/README.DockerHub-Hook.md.gotmpl" \
				--output-file="docs/README.DockerHub-Hook.md"; \
			helm-docs \
				--template-files="$(HELM_DOCS_DIR)/templates.gotmpl" \
				--template-files=".helm-docs.gotmpl" \
				--template-files="$(HELM_DOCS_DIR)/README.ArtifactHub.md.gotmpl" \
				--output-file="docs/README.ArtifactHub.md"; \
		else \
			echo "Ignoring Docs creation process for Chart $$dir, because no docs folder found at: $${dir}/docs"; \
		fi) \
	done

.PHONY: scanner-docs
scanner-docs: ## Generate documentation for scanners.
	@for chart in $(SCANNERS_CHART_LIST); do \
		$(BIN_DIR)/generate-docs.sh --scanner "$${chart}" $(HELM_DOCS_DIR); \
	done

# FIXME: #754 Remove .ONESHELL which is unsupported on some systems
.PHONY: operator-docs
.ONESHELL:
operator-docs: ## Generate documentation for the operator.
	# Start in the operator folder
	cd operator
	if [ -d "docs" ]; then
		echo "Docs Folder found at: operator/docs"
		helm-docs --template-files=$(HELM_DOCS_DIR)/templates.gotmpl --template-files=.helm-docs.gotmpl --template-files=$(HELM_DOCS_DIR)/README.DockerHub-Core.md.gotmpl --output-file=docs/README.DockerHub-Core.md
		helm-docs --template-files=$(HELM_DOCS_DIR)/templates.gotmpl --template-files=.helm-docs.gotmpl --template-files=$(HELM_DOCS_DIR)/README.ArtifactHub.md.gotmpl --output-file=docs/README.ArtifactHub.md
	else
		echo "Ignoring Docs creation process for Chart $$dir, because no `docs` folder found at: operator/docs"
	fi

# FIXME: #754 Remove .ONESHELL which is unsupported on some systems
.PHONY: auto-discovery-docs
.ONESHELL:
auto-discovery-docs: ## Generate documentation for the auto-discovery.
	cd auto-discovery/kubernetes
	if [ -d "docs" ]; then
		echo "Docs Folder found at: auto-discovery/kubernetes/docs"
		helm-docs --template-files=$(HELM_DOCS_DIR)/templates.gotmpl --template-files=.helm-docs.gotmpl --template-files=$(HELM_DOCS_DIR)/README.DockerHub-Core.md.gotmpl --output-file=docs/README.DockerHub-Core.md
		helm-docs --template-files=$(HELM_DOCS_DIR)/templates.gotmpl --template-files=.helm-docs.gotmpl --template-files=$(HELM_DOCS_DIR)/README.ArtifactHub.md.gotmpl --output-file=docs/README.ArtifactHub.md
	else
		echo "Ignoring Docs creation process for Chart $$dir, because no `docs` folder found at: auto-discovery/kubernetes/docs"
	fi

# FIXME: #754 Remove .ONESHELL which is unsupported on some systems
.PHONY: demo-apps-docs
.ONESHELL:
demo-apps-docs: ## Generate documentation for demo apps.
	# Start in the hooks folder
	cd demo-targets
	# https://github.com/koalaman/shellcheck/wiki/SC2044
	find . -type f ! -name "$(printf "*\n*")" -name Chart.yaml | while IFS= read -r chart; do
	(
		dir="$$(dirname "$${chart}")"
		echo "Processing Helm Chart in $$dir"
		cd "$${dir}" || exit
		if [ -d "docs" ]; then
				echo "Docs Folder found at: $${dir}/docs"
				helm-docs --template-files=$(HELM_DOCS_DIR)/templates.gotmpl --template-files=.helm-docs.gotmpl --template-files=$(HELM_DOCS_DIR)/README.DockerHub-Target.md.gotmpl --output-file=docs/README.DockerHub-Target.md
				helm-docs --template-files=$(HELM_DOCS_DIR)/templates.gotmpl --template-files=.helm-docs.gotmpl --template-files=$(HELM_DOCS_DIR)/README.ArtifactHub.md.gotmpl --output-file=docs/README.ArtifactHub.md
		else
				echo "Ignoring Docs creation process for Chart $$dir, because no `docs` folder found at: $${dir}/docs"
		fi
	)
	done

.PHONY: docs
docs: readme hook-docs scanner-docs operator-docs auto-discovery-docs demo-apps-docs ## Generate all documentation.

.PHONY: create-new-scanner
create-new-scanner: ## Creates templates for a new scanner, pass NAME=NEW-SCANNER
ifdef NAME
	cp -r ./.templates/new-scanner ./scanners/$(NAME)
	find ./scanners/$(NAME) -type f ! -name 'tmp' \
		-exec sed -n 's/new-scanner/$(NAME)/g;w ./scanners/$(NAME)/tmp' {} \; \
		-exec mv ./scanners/$(NAME)/tmp {} \;
	mv ./scanners/$(NAME)/templates/new-scanner-parse-definition.yaml ./scanners/$(NAME)/templates/$(NAME)-parse-definition.yaml
	mv ./scanners/$(NAME)/templates/new-scanner-scan-type.yaml ./scanners/$(NAME)/templates/$(NAME)-scan-type.yaml
else
	@echo "Scanner name not defined, please provide via make create-new-scanner NAME=NEW-SCANNER"
endif

.PHONY: help
help: ## Display this help screen.
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

all: help

.PHONY:
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

.PHONY:
npm-test-all: ## Runs all Jest based test suites.
	npm test -- --testPathIgnorePatterns "/integration-tests/"

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

.PHONY:
readme:
	@echo ".: ⚙ Generate Helm Docs."
	helm-docs --template-files=./.helm-docs/templates.gotmpl --template-files=.helm-docs.gotmpl --template-files=./.helm-docs/README.md.gotmpl

.PHONY:
help: ## Display this help screen.
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

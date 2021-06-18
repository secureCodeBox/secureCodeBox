# SPDX-FileCopyrightText: 2020 iteratec GmbH
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
	npm test

.PHONY:
help: ## Display this help screen.
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

PROJECT_DIR	= $(shell pwd)
DIAGRAMS		:= $(shell find $(PROJECT_DIR) -type f -name '*.puml')
IMAGES			:= $(addsuffix .png, $(basename $(DIAGRAMS)))

all: help

.PHONY: puml
puml: $(IMAGES) ## Generate PlantUML images

.PHONY: clean
clean: ## Wipe node_modules
	rm -rf $(PROJECT_DIR)/node_modules

.PHONY: install
install: ## Install Docusaurus stuff. (Needed once before you invoke start target).
	npm install

.PHONY: start
start: ## Start local Docusaurus. (Visit http://localhost:3000)
	npm start

%.png: %.puml
	plantuml -tpng $^

.PHONY: help
help: ## Display this help screen.
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


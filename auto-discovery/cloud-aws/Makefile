# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

include ../../prerequisites.mk

IMG_NS ?= securecodebox

# Image URL to use all building/pushing image targets
IMG ?= auto-discovery-cloud-aws

# Tag used for the image
IMG_TAG ?= sha-$$(git rev-parse --short HEAD)

# ENVTEST_K8S_VERSION refers to the version of kubebuilder assets to be downloaded by envtest binary.
ENVTEST_K8S_VERSION = 1.24.2

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set).
# IMPORTANT: The body of conditionals MUST not be indented! Indentation result in
# errors on macOS/FreeBSD because the line wil be interpreted as command which must
# inside a recipe (target). (see https://github.com/secureCodeBox/secureCodeBox/issues/1353)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

# Setting SHELL to bash allows bash commands to be executed by recipes.
# This is a requirement for 'setup-envtest.sh' in the test target.
# Options are set to exit when a recipe line exits non-zero or a piped command fails.
SHELL = /usr/bin/env bash -o pipefail
.SHELLFLAGS = -ec

.PHONY: all
all: build

##@ General

# The help target prints out all targets with their descriptions organized
# beneath their categories. The categories are represented by '##@' and the
# target descriptions by '##'. The awk commands is responsible for reading the
# entire set of makefiles included in this invocation, looking for lines of the
# file as xyz: ## something, and then pretty-format the target and help. Then,
# if there's a line with ##@ something, that gets pretty-printed as a category.
# More info on the usage of ANSI control characters for terminal formatting:
# https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
# More info on the awk command:
# http://linuxcommand.org/lc3_adv_awk.php

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: fmt
fmt: ## Run go fmt against code.
	go fmt ./...

.PHONY: vet
vet: ## Run go vet against code.
	go vet ./...

.PHONY: test
test: fmt vet envtest ## Run tests.
	KUBEBUILDER_ASSETS="$(shell $(ENVTEST) use $(ENVTEST_K8S_VERSION) -p path)" go test ./... -coverprofile cover.out

.PHONY: ginkgo
ginkgo: fmt vet envtest ## Run tests.
	KUBEBUILDER_ASSETS="$(shell $(ENVTEST) use $(ENVTEST_K8S_VERSION) -p path)" $(GOBIN)/ginkgo test ./... -coverprofile cover.out -v --progress

## Helm unit tests
.PHONY: helm-unit-tests
helm-unit-tests:
	echo "Running helm unit tests for the cloud-aws autodiscovery";
	helm unittest .

##@ Build

.PHONY: build
build: fmt vet ## Build service binary.
	go build -o bin/service main.go

.PHONY: run
run: fmt vet ## Run the service from your host.
	go run ./main.go --config auto-discovery-cloud-aws-config.yaml

.PHONY: docker-build
docker-build: test ## Build docker image with the service.
	@echo ".: ⚙️ Build Container Images"
	docker build -t ${IMG_NS}/${IMG}:${IMG_TAG} .

.PHONY: docker-push
docker-push: ## Push docker image with the service.
	docker push ${IMG_NS}/${IMG}:${IMG_TAG}

.PHONY: docker-export
docker-export:
	@echo ".: 💾 Export Container Images"
	docker save $(IMG_NS)/$(IMG):$(IMG_TAG) > $(IMG).tar

##@ Deployment

.PHONY: kind-import
kind-import:
	@echo ".: 💾 Importing the image archive to local kind cluster."
	kind load image-archive ./$(IMG).tar

.PHONY: helm-deploy
helm-deploy:
	@echo ".: ⚙️ Deploying auto-discovery-cloud-aws with the Image tag '$(IMG_TAG)' into kind."
	helm -n integration-tests upgrade --install auto-discovery-cloud-aws ./ --wait \
		--set="image.repository=docker.io/$(IMG_NS)/$(IMG)" \
		--set="image.tag=$(IMG_TAG)" \
		--set="image.pullPolicy=IfNotPresent" \
		--set="config.aws.queueUrl=$(SQS_QUEUE_URL)" \
		--set="config.aws.region=$(AWS_REGION)"

##@ Build Dependencies

## Location to install dependencies to
LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)

## Tool Binaries
ENVTEST ?= $(LOCALBIN)/setup-envtest

.PHONY: envtest
envtest: $(ENVTEST) ## Download envtest-setup locally if necessary.
$(ENVTEST): $(LOCALBIN)
	test -s $(LOCALBIN)/setup-envtest || GOBIN=$(LOCALBIN) go install sigs.k8s.io/controller-runtime/tools/setup-envtest@latest

.PHONY: print-envtest-path
print-envtest-path: ## Print the path of the envtest binaries for use with other tools
# suppress output so that result can be stored as env var
	@$(MAKE) -s envtest
	@$(ENVTEST) use $(ENVTEST_K8S_VERSION) -p path

debug.env: ## Allow vscode profiles to access the envtest assets
	printf '%s' 'KUBEBUILDER_ASSETS=' > debug.env
	$(MAKE) print-envtest-path >> debug.env

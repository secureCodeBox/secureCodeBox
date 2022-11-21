# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

include ../prerequisites.mk
include ../env-paths.mk
## Telling the env-paths file where the root project dir is. This is done to allow the generation of the paths of the different project folders relative to where the makefile is being run from.
## So BIN_DIR= $(PROJECT_DIR)/bin will be BIN_DIR=../bin
PROJECT_DIR=..

IMG_NS ?= securecodebox

# ENVTEST_K8S_VERSION refers to the version of kubebuilder assets to be downloaded by envtest binary.
ENVTEST_K8S_VERSION = 1.24.2

# Image URL to use all building/pushing image targets for the operator
OPERATOR_IMG ?= operator

# Image URL to use all building/pushing image targets for the lurker
LURKER_IMG ?= lurker

# Tag used for the images
IMG_TAG ?= sha-$$(git rev-parse --short HEAD)

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
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

.PHONY: manifests
manifests: controller-gen ## Generate WebhookConfiguration, ClusterRole and CustomResourceDefinition objects.
	$(CONTROLLER_GEN) rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases

.PHONY: generate
generate: controller-gen ## Generate code containing DeepCopy, DeepCopyInto, and DeepCopyObject method implementations.
	$(CONTROLLER_GEN) object:headerFile="hack/boilerplate.go.txt" paths="./..."

.PHONY: fmt
fmt: ## Run go fmt against code.
	go fmt ./...

.PHONY: vet
vet: ## Run go vet against code.
	go vet ./...

.PHONY: test
test: manifests generate fmt vet envtest ## Run tests.
	KUBEBUILDER_ASSETS="$(shell $(ENVTEST) use $(ENVTEST_K8S_VERSION) -p path)" go test ./... -coverprofile cover.out

.PHONY: view-coverage
view-coverage:
	go tool cover -html=cover.out

##@ Build

.PHONY: build
build: generate fmt vet ## Build manager binary.
	go build -o bin/manager main.go

.PHONY: run
run: manifests generate fmt vet ## Run a controller from your host.
	go run ./main.go

.PHONY: docker-build
docker-build: test ## Build docker image with the manager.
	@echo ".: ⚙️ Build Container Images"
	docker build -t $(IMG_NS)/${OPERATOR_IMG}:${IMG_TAG} .
	cd $(PROJECT_DIR)/lurker && docker build -t $(IMG_NS)/$(LURKER_IMG):$(IMG_TAG) .

.PHONY: docker-push
docker-push: ## Push docker image with the manager.
	docker push $(IMG_NS)/${OPERATOR_IMG}:${IMG_TAG}
	docker push $(IMG_NS)/$(LURKER_IMG):$(IMG_TAG)

.PHONY: docker-export
docker-export:
	$(MAKE) docker-export-operator
	$(MAKE) docker-export-lurker

.PHONY: docker-export-operator
docker-export-operator:
	@echo ".: 💾 Export Operator Image"
	docker save $(IMG_NS)/$(OPERATOR_IMG):$(IMG_TAG) > $(OPERATOR_IMG).tar

.PHONY: docker-export-lurker
docker-export-lurker:
	@echo ".: 💾 Export Lurker Image"
	docker save $(IMG_NS)/$(LURKER_IMG):$(IMG_TAG) > $(LURKER_IMG).tar

##@ Deployment

.PHONY: kind-import
kind-import:
	@echo ".: 💾 Importing the image archive to local kind cluster."
	kind load image-archive ./$(OPERATOR_IMG).tar
	kind load image-archive ./$(LURKER_IMG).tar

.PHONY: helm-deploy
helm-deploy:
	@echo ".: ⚙️ Deploying Operator with the Image tag '$(IMG_TAG)' into kind."
	# If not exists create namespace where the tests will be executed
	kubectl create namespace integration-tests --dry-run=client -o yaml | kubectl apply -f -
	# If not exists create secureCodeBox operator namespace
	kubectl create namespace securecodebox-system --dry-run=client -o yaml | kubectl apply -f -
	helm -n securecodebox-system upgrade --install securecodebox-operator ./ --wait \
		--set="image.repository=docker.io/$(IMG_NS)/$(OPERATOR_IMG)" \
		--set="image.tag=$(IMG_TAG)" \
	--set="image.pullPolicy=IfNotPresent" \
		--set="lurker.image.repository=docker.io/$(IMG_NS)/$(LURKER_IMG)" \
		--set="lurker.image.tag=$(IMG_TAG)" \
		--set="lurker.image.pullPolicy=IfNotPresent"

.PHONY: install
install: manifests kustomize ## Install CRDs into the K8s cluster specified in ~/.kube/config.
	$(KUSTOMIZE) build config/crd | kubectl apply -f -

.PHONY: uninstall
uninstall: manifests kustomize ## Uninstall CRDs from the K8s cluster specified in ~/.kube/config.
	$(KUSTOMIZE) build config/crd | kubectl delete -f -

.PHONY: deploy
deploy: manifests kustomize ## Deploy controller to the K8s cluster specified in ~/.kube/config.
	cd config/manager && $(KUSTOMIZE) edit set image controller=${OPERATOR_IMG}
	$(KUSTOMIZE) build config/default | kubectl apply -f -

.PHONY: undeploy
undeploy: ## Undeploy controller from the K8s cluster specified in ~/.kube/config.
	$(KUSTOMIZE) build config/default | kubectl delete -f -

##@ Build Dependencies

## Location to install dependencies to
LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)

## Tool Binaries
KUSTOMIZE ?= $(LOCALBIN)/kustomize
CONTROLLER_GEN ?= $(LOCALBIN)/controller-gen
ENVTEST ?= $(LOCALBIN)/setup-envtest

## Tool Versions
KUSTOMIZE_VERSION ?= v3.8.7
CONTROLLER_TOOLS_VERSION ?= v0.9.2

KUSTOMIZE_INSTALL_SCRIPT ?= "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"
.PHONY: kustomize
kustomize: $(KUSTOMIZE) ## Download kustomize locally if necessary.
$(KUSTOMIZE): $(LOCALBIN)
	test -s $(LOCALBIN)/kustomize || { curl -s $(KUSTOMIZE_INSTALL_SCRIPT) | bash -s -- $(subst v,,$(KUSTOMIZE_VERSION)) $(LOCALBIN); }

.PHONY: controller-gen
controller-gen: $(CONTROLLER_GEN) ## Download controller-gen locally if necessary.
$(CONTROLLER_GEN): $(LOCALBIN)
	test -s $(LOCALBIN)/controller-gen || GOBIN=$(LOCALBIN) go install sigs.k8s.io/controller-tools/cmd/controller-gen@$(CONTROLLER_TOOLS_VERSION)

.PHONY: envtest
envtest: $(ENVTEST) ## Download envtest-setup locally if necessary.
$(ENVTEST): $(LOCALBIN)
	test -s $(LOCALBIN)/setup-envtest || GOBIN=$(LOCALBIN) go install sigs.k8s.io/controller-runtime/tools/setup-envtest@latest

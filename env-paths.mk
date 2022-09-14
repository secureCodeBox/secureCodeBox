# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

PROJECT_DIR					= $(shell pwd)
BIN_DIR						= $(PROJECT_DIR)/bin
SCANNERS_DIR				= $(PROJECT_DIR)/scanners
HOOKS_DIR					= $(PROJECT_DIR)/hooks
DEMO_TARGETS_DIR			= $(PROJECT_DIR)/demo-targets
OPERATOR_DIR				= $(PROJECT_DIR)/operator
PARSER_SDK_DIR				= $(PROJECT_DIR)/parser-sdk/nodejs
HOOK_SDK_DIR				= $(PROJECT_DIR)/hook-sdk/nodejs
AUTO_DISCOVERY_DIR			= $(PROJECT_DIR)/auto-discovery
HELM_DOCS_DIR				= $(PROJECT_DIR)/.helm-docs
TEMPLATES_DIR				= $(PROJECT_DIR)/.templates
TESTS_HELPERS_DIR			= $(PROJECT_DIR)/tests/integration

SCANNERS_CHART_LIST			:= $(sort $(wildcard $(SCANNERS_DIR)/*/Chart.yaml))
SCANNERS_TEST_LIST			:= $(sort $(wildcard $(SCANNERS_DIR)/*/Makefile))
HOOKS_CHART_LIST			:= $(sort $(wildcard $(HOOKS_DIR)/*/Chart.yaml))
HOOKS_TEST_LIST				:= $(sort $(wildcard $(HOOKS_DIR)/*/Makefile))
DEMO_TARGETS_CHART_LIST		:= $(sort $(wildcard $(DEMO_TARGETS_DIR)/*/Chart.yaml))

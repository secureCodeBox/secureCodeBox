# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Usage:
# make        # generate all
# make clean  # remove ALL binaries and objects

.PHONY: all init test local-test unit-test docker-test
.DEFAULT_GOAL:= generate

all: init

init:
	pip3 install -r requirements.txt

test: unit-test docker-test local-test

unit-test:
	@echo "Running with Unit Tests based on pytest ..."
	pytest --ignore-glob='*_local.py'

docker-test:
	@echo "Running local Integrations Tests based on docker-compose..."
	pytest ./tests/test_integration_docker_local.py  --log-cli-level "INFO"

local-test:
	@echo "Running local Integrations Tests based on local ZAP + docker-compose..."
	pytest ./tests/test_integration_zap_local.py --log-cli-level "INFO"
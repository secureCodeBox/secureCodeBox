# Usage:
# make        # generate all
# make clean  # remove ALL binaries and objects

.PHONY: all init test local-test unit-test docker-test
.DEFAULT_GOAL:= generate

all: init

init:
	pip3 install -r requirements.txt

test: unit-test docker-test

unit-test:
	@echo "Running with Unit Tests based on pytest ..."
	pytest --ignore-glob='*_local.py' --ignore=tests/docker

docker-test:
	@echo "Running local Integrations Tests based on docker-compose..."
	#docker-compose up
    # docker-compose -f docker-compose.yaml down
	pytest --ignore-glob='*_zap_local.py'

local-test:
	@echo "Running local Integrations Tests based on ZAP..."
	python3 ./tests/integration_test_zap_local.py --log=DEBUG
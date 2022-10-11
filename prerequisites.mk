#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#
#
# This is an include file for our module make files to check some prerequisite.
#

# Here we check that the path to the project directory does not contain white spaces.
#
# We do not allow white spaces for reasons (See https://github.com/secureCodeBox/secureCodeBox/issues/1353).
# This is an implementation which should work in any shell (some CI jobs use /bin/sh): It removes spaces from the tested
# var and compares it with the original string. If they're same there are no spaces in string.
PROJECT_DIR_CLEANSED=$(shell printf "%s" $(PROJECT_DIR))
PROJECT_PATH_CONTAINS_WHITESPACES=$(shell if [ "$(PROJECT_DIR)" = "$(PROJECT_DIR_CLEANSED)" ]; then echo 0; else echo 1; fi)
# IMPORTANT: The body of conditionals MUST not be indented! Indentation result in
# errors on macOS/FreeBSD because the line wil be interpreted as command which must
# inside a recipe (target). (see https://github.com/secureCodeBox/secureCodeBox/issues/1353)
ifeq ($(PROJECT_PATH_CONTAINS_WHITESPACES),1)
$(error The path to this repo ($(PROJECT_DIR)) contains white spaces and make can't deal with this! \
Move or checkout this project to a location w/o spaces in the direcotry path)
endif

# Here we check for a proper installed Python.
PYTHON = $(shell which python3)
# IMPORTANT: The body of conditionals MUST not be indented! Indentation result in
# errors on macOS/FreeBSD because the line wil be interpreted as command which must
# inside a recipe (target). (see https://github.com/secureCodeBox/secureCodeBox/issues/1353)
ifeq ($(PYTHON),)
PYTHON = $(shell which python)
ifeq ($(PYTHON),)
$(error PYTHON=$(PYTHON) not found in $(PATH))
endif
endif

PYTHON_VERSION_MIN=3.0
PYTHON_VERSION=$(shell $(PYTHON) -c \
'import sys; print(float(str(sys.version_info[0]) + "." + str(sys.version_info[1])))')
PYTHON_VERSION_OK=$(shell $(PYTHON) -c 'print(int($(PYTHON_VERSION) >= $(PYTHON_VERSION_MIN)))' )

# IMPORTANT: The body of conditionals MUST not be indented! Indentation result in
# errors on macOS/FreeBSD because the line wil be interpreted as command which must
# inside a recipe (target). (see https://github.com/secureCodeBox/secureCodeBox/issues/1353)
ifeq ($(PYTHON_VERSION_OK), 0) # True == 1
$(error Need python version >= $(PYTHON_VERSION_MIN) (current: $(PYTHON_VERSION)))
endif

# Here wecheck that all necessary 3rd party tools are present.
# Thx to https://stackoverflow.com/questions/5618615/check-if-a-program-exists-from-a-makefile
PREREQUISITES = make docker kind git node npm npx kubectl helm yq java go
# Python is separated here (and added hardcoded in the error message) because it will lead to clunky python binary
# paths in the error message if one uses PyEnv, instead of simply the tool name to install.
EXECUTABLES = $(PREREQUISITES) $(PYTHON)
ALL_EXECUTABLES_OK := $(foreach exec,\
	$(EXECUTABLES),\
	$(if $(shell which $(exec)),\
		some string,\
		$(error "The prerequisites are not met to execute this makefile! No '$(exec)' found in your PATH. Install all these tools: $(PREREQUISITES) python"))\
)

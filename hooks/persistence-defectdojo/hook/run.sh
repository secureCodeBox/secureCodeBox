#!/usr/bin/env bash

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

java -jar ./build/libs/defectdojo-persistenceprovider-1.0.0-SNAPSHOT.jar "$@"

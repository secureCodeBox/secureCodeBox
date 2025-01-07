#!/usr/bin/env bash

set -euo pipefail

java -jar ./build/libs/defectdojo-persistenceprovider-1.0.0-SNAPSHOT.jar "$@"

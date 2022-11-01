#!/usr/bin/env bash

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#
# Convenience script to start a local minio instance, where your scanner results and findings are stored by default.
# Port can be set via -p option.
# The instance runs on your localhost at your defined port (default: 9000).
#
# The script (i.e. the port forwarding) must run while you want to access the minio instance.
# However, it does not need to run while scans are executed in order to store the results.
#
# Will also print your access key and secret key.
#
# For more information see
# https://www.securecodebox.io/docs/getting-started/installation/#accessing-the-included-minio-instance

set -euo pipefail
shopt -s extglob

COLOR_EMPHASIS="\e[32m"
COLOR_RESET="\e[0m"
HOST_PORT=9000 # Default port

function print() {
  if [[ $# == 0 ]]; then
    echo
  elif [[ $# == 1 ]]; then
    local message="${1}"
    echo "${message}"
  elif [[ $# == 2 ]]; then
    local color="${1}"
    local message="${2}"
    echo -e "${color}${message}${COLOR_RESET}"
  fi
}

if [[ "$#" -eq 2 ]]; then
  if [[ $1 = "-p" || $1 = "--port" ]]; then
    HOST_PORT=$2
    print "Using host port $HOST_PORT"
  fi
else
  print "No port with option -p set. Using default host port 9000"
fi

print "$COLOR_EMPHASIS" "Starting minio instance on localhost:9000..\n"

print "Your access key: "
ACCESS_KEY=$(kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.root-user}' |
  base64 --decode)
print "$COLOR_EMPHASIS" "$ACCESS_KEY"

print "Your secret key: "
SECRET_KEY=$(kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.root-password}' |
  base64 --decode)
print "$COLOR_EMPHASIS" "$SECRET_KEY"

kubectl port-forward -n securecodebox-system service/securecodebox-operator-minio "$HOST_PORT":9001

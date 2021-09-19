#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0
#
# Convenience script to start a local minio instance, where your scanner results and findings are stored by default.
# The instance runs on your localhost at port 9000.
#
# The script (i.e. the port forwarding) must run while you want to access the minio instance.
# However, it does not need to run while scans are executed in order to store the results.
#
# Will also print your access key and secret key.
#
# For more information see
# https://docs.securecodebox.io/docs/getting-started/installation/#accessing-the-included-minio-instance

set -euo pipefail
shopt -s extglob

COLOR_EMPHASIS="\e[32m"
COLOR_RESET="\e[0m"

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

print "$COLOR_EMPHASIS" "Starting minio instance on localhost:9000..\n"

print "Your access key: "
ACCESS_KEY=$(kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.accesskey}' \
| base64 --decode;)
print "$COLOR_EMPHASIS" "$ACCESS_KEY"

print "Your secret key: "
SECRET_KEY=$(kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.secretkey}' \
| base64 --decode;)
print "$COLOR_EMPHASIS" "$SECRET_KEY"

kubectl port-forward -n securecodebox-system service/securecodebox-operator-minio 9000:9000

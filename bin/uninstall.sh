#!/usr/bin/env bash

# Official uninstall script for the secureCodeBox
#
# Removes all available resources (scanners, demo-apps, hooks, operator) and namespaces
#
# For more information see https://docs.securecodebox.io/

set -eu
shopt -s extglob

# @see: http://wiki.bash-hackers.org/syntax/shellvars
[ -z "${SCRIPT_DIRECTORY:-}" ] \
  && SCRIPT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

BASE_DIR=$(dirname "${SCRIPT_DIRECTORY}")

function uninstallResources() {
  local resource_directory="$1"

  local resources=()
  for path in "$resource_directory"/*; do
    [ -d "${path}" ] || continue # skip if not a directory
    local directory
    directory="$(basename "${path}")"
    resources+=("${directory}")
  done

  for resource in "${resources[@]}"; do
    local resource_name="${resource//+([_])/-}" # Necessary because ssh_scan is called ssh-scan
    helm uninstall "$resource_name" || true
  done
}

helm -n securecodebox-system uninstall securecodebox-operator || true

uninstallResources "$BASE_DIR/scanners"
uninstallResources "$BASE_DIR/demo-apps"
uninstallResources "$BASE_DIR/hooks"

kubectl delete namespaces securecodebox-system || true

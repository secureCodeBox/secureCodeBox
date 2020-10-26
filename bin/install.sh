#!/usr/bin/env bash

set -eu
shopt -s extglob

COLOR_HIGHLIGHT="\e[35m"
COLOR_OK="\e[32m"
COLOR_ERROR="\e[31m"
COLOR_RESET="\e[0m"

# @see: http://wiki.bash-hackers.org/syntax/shellvars
[ -z "${SCRIPT_DIRECTORY:-}" ] \
  && SCRIPT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )" \
  && export SCRIPT_DIRECTORY

BASE_DIR=$(dirname "${SCRIPT_DIRECTORY}")

function print() {
  if [[ $# = 0 ]]; then
    echo
  elif [[ $# = 1 ]]; then
    local message="${1}"
    echo "${message}"
  elif [[ $# = 2 ]]; then
    local color="${1}"
    local message="${2}"
    echo -e "${color}${message}${COLOR_RESET}"
  fi
}

function installResources() {
  local resourceDirectory="$1"
  local namespace="$2"

  resources=()
  for path in "$resourceDirectory"/*; do
    [ -d "${path}" ] || continue # skip if not a directory
    directory="$(basename "${path}")"
    resources+=("${directory}")
  done

  for resource in "${resources[@]}"; do
    print "Do you want to install $resource? [y/N]"
    read -r line

    if [[ $line == *[Yy] ]]; then
      resourceName="${resource//+([_])/-}" # Necessary because ssh_scan is called ssh-scan
      helm upgrade --install -n "$namespace" "$resourceName" "$resourceDirectory"/"$resource"/ || print "$COLOR_ERROR" "Installation of '$resource' failed"
    fi
  done

  print
  print "$COLOR_OK" "Completed to install '$resourceDirectory'!"
}

print "$COLOR_HIGHLIGHT" "Welcome to the secureCodeBox!"
print "This interactive installation script will guide you through all the relevant installation steps in order to have you ready to scan."
print "Start? [y/N]"

read -r line

if [[ $line == *[Yy] ]]; then
  print "Starting!"
else
  exit
fi

print
print "Checking kubectl..."
kube=$(kubectl version)

if [[ $kube == *"GitVersion"* ]]; then
  print "$COLOR_OK" "It's there!"
else
  print "$COLOR_ERROR" "Kubectl not found, quitting..."
  exit
fi

print
print "Creating namespace securecodebox-system"
kubectl create namespace securecodebox-system || print "Namespace already exists..."

print "Installing the operator in the securecodebox-system namespace"
helm -n securecodebox-system upgrade --install securecodebox-operator "$BASE_DIR"/operator/ \
  && print "$COLOR_OK" "Successfully installed the operator!" \
  || (print "$COLOR_ERROR" "Operator installation failed, cancelling..." && exit)

print
print "Starting to install scanners..."
installResources "$BASE_DIR/scanners" "default"
cd ..

print
print "Starting to install demo-apps..."
print "Do you want to install the demo apps in a separate namespace? Otherwise they will be installed into the [default] namespace [y/N]"
read -r line
namespace="default"
if [[ $line == *[Yy] ]]; then
  print "Please provide a name for the namespace:"
  read -r namespace
  kubectl create namespace "$namespace" || print "Namespace already exists or could not be created.. "
fi

installResources "$BASE_DIR/demo-apps" "$namespace"
cd ..

print
print "Starting to install hooks..."
installResources "$BASE_DIR/hooks" "default"
cd ..

print
print "$COLOR_OK" "Information about your cluster:"
kubectl get namespaces
print
kubectl get scantypes
print
kubectl get pods

print
print "$COLOR_OK" "Finished installation successfully!"

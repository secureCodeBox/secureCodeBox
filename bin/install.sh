#!/usr/bin/env bash

set -eu
shopt -s extglob

COLOR_HIGHLIGHT="\e[35m"
COLOR_OK="\e[32m"
COLOR_ERROR="\e[31m"
COLOR_RESET="\e[0m"

function print() {
  if [[ $# = 0 ]]; then
    echo
  elif [[ $# = 1 ]]; then
    local message="${2}"
    echo "${message}"
  elif [[ $# = 2 ]]; then
    local color="${1}"
    local message="${2}"
    echo -e "${color}${message}${COLOR_RESET}"
  fi
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

[ -z "${SCRIPT_DIRECTORY:-}" ] \
  && SCRIPT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )" \
  && export SCRIPT_DIRECTORY

cd "$SCRIPT_DIRECTORY"
cd ..

print "Installing the operator in the securecodebox-system namespace"
helm -n securecodebox-system upgrade --install securecodebox-operator ./operator/ \
  && print "$COLOR_OK" "Successfully installed the operator!" \
  || (print "$COLOR_ERROR" "Operator installation failed, cancelling..." && exit)

# $1: resourceName, $2: namespace
function installResources() {
  cd "$1"
  resources=()
  for directory in */
  do
    resources+=("${directory::-1}")
  done

  for resource in "${resources[@]}"
  do
  while true
  print "Do you want to install $resource? [y/n/(r)eadme]"
  do
    read -r line
    # Install:
    if [[ $line == *[Yy] ]]; then
      resourceName="${resource//+([_])/-}" # Necessary because ssh_scan is called ssh-scan
      helm upgrade --install -n "$2" "$resourceName" ./"$resource"/ || print "$COLOR_ERROR" "Installation of '$resource' failed"
      break
    # Show Readme:
    elif [[ $line == *[r] ]]; then
      grep '' ./"$resource"/README.md
    # Do not install:
    elif [[ $line == *[Nn] ]]; then
      break
    fi
  done
  done

  print
  print "$COLOR_OK" "Completed to install $1!"
}

print
print "Starting to install scanners..."
installResources "scanners" "default"
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

installResources "demo-apps" "$namespace"
cd ..

print
print "Starting to install hooks..."
installResources "hooks" "default"
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

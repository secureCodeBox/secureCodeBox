#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2020 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# Official installation script for the secureCodeBox
#
# Creates namespace, securecodebox-system, and installs the operator.
# Then installs all possible resources (scanners, demo-apps, hooks).
#
# There exist different modes:
# Call without parameters to install interactively
# Call with --all to install all available resources automatically
# Call with --scanners / --demo-apps / --hooks to only install the wanted resources
# Call with --help for usage information
#
# For more information see https://docs.securecodebox.io/

set -euo pipefail
shopt -s extglob

USAGE="Usage: $(basename "$0") [--all] [--scanners] [--hooks] [--demo-apps] [--help|-h]"

COLOR_HIGHLIGHT="\e[35m"
COLOR_OK="\e[32m"
COLOR_ERROR="\e[31m"
COLOR_RESET="\e[0m"

# @see: http://wiki.bash-hackers.org/syntax/shellvars
[ -z "${SCRIPT_DIRECTORY:-}" ] \
  && SCRIPT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

BASE_DIR=$(dirname "${SCRIPT_DIRECTORY}")

INSTALL_INTERACTIVE=''
INSTALL_SCANNERS=''
INSTALL_DEMO_APPS=''
INSTALL_HOOKS=''

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

function printHelp() {
  local help
  help=$(cat <<- EOT
$USAGE
The installation is interactive if no arguments are provided.

Options

  --all          Install scanners, demo-apps and hooks
  --scanners     Install scanners
  --demo-apps    Install demo-apps
  --hooks        Install hooks
  -h|--help      Show help

Examples:

  install.sh --all  Installs the operator in namespace: securecodebox-system and
                    all resources in namespace: default

  install.sh --hooks --scanners Installs only operator, scanners and hooks
EOT
  )
  print "$help"
}

function exitIfKubectlIsNotInstalled() {
  print
  print "Checking kubectl..."
  local kube
  kube=$(kubectl cluster-info) || true

  if [[ $kube == *"running"* ]]; then
    print "$COLOR_OK" "Kubectl is there!"
  else
    print "$COLOR_ERROR" "Kubectl not found or not working, quitting..."
    exit 1
  fi
}

function exitIfHelmIsNotInstalled() {
  print
  print "Checking helm..."
  local helm
  helm=$(helm version) || true

  if [[ $helm == *"Version"* ]]; then
    print "$COLOR_OK" "Helm is there!"
  else
    print "$COLOR_ERROR" "Helm not found or not working, quitting..."
    exit 1
  fi
}

# Create namespace securecodebox-system and install Operator there in one step,
# because the namespace is not used otherwise
function createNamespaceAndInstallOperator() {
  print
  print "Creating namespace securecodebox-system"
  kubectl create namespace securecodebox-system || print "Namespace already exists..."

  print "Installing the operator in the securecodebox-system namespace"

  if [[ $(helm -n securecodebox-system upgrade --install securecodebox-operator "$BASE_DIR"/operator/) ]]; then
    print "$COLOR_OK" "Successfully installed the operator!"
  else
    print "$COLOR_ERROR" "Operator installation failed, cancelling..." && exit 1
  fi
}

# installResources() installs all the available helm Charts found in the subdirectories for the given directory
# @$1 - resource_directory: Directory where the subdirectories with Chart.yamls are located
# @$2 - namespace: Namespace where the resources should be installed
# @$3 - unattended: If the installation is interactive or unattended
function installResources() {
  local resource_directory="$1"
  local namespace="$2"
  local unattended="$3"

  local resources=()
  for path in "$resource_directory"/*; do
    [ -d "${path}" ] || continue # skip if not a directory
    local directory
    directory="$(basename "${path}")"
    # Check if directory contains Chart.yaml File:
    if [[ -f "${resource_directory}/${directory}/Chart.yaml" ]]; then
      resources+=("${directory}")
    fi
  done

  if [[ $unattended == True ]]; then
    for resource in "${resources[@]}"; do
      local resource_name="${resource//+([_])/-}" # Necessary because ssh_scan is called ssh-scan
      helm upgrade --install -n "$namespace" "$resource_name" "$resource_directory"/"$resource"/ \
      || print "$COLOR_ERROR" "Installation of '$resource' failed"
    done

  else
    for resource in "${resources[@]}"; do
      print "Do you want to install $resource? [y/N]"
      local line
      read -r line

      if [[ $line == *[Yy] ]]; then
        local resource_name="${resource//+([_])/-}"
        helm upgrade --install -n "$namespace" "$resource_name" "$resource_directory"/"$resource"/ \
        || print "$COLOR_ERROR" "Installation of '$resource' failed"
      fi
    done
  fi

  print
  print "$COLOR_OK" "Completed to install '$resource_directory'!"
}

function welcomeToInteractiveInstall() {
  print "$COLOR_HIGHLIGHT" "Welcome to the secureCodeBox!"
  print "This interactive installation script will guide you through all the relevant installation steps in order to have you ready to scan."
  print "Start? [y/N]"

  read -r LINE

  if [[ $LINE == *[Yy] ]]; then
    print "Starting!"
  else
    exit
  fi
}

function interactiveInstall() {
  print
  print "Starting to install scanners..."
  installResources "$BASE_DIR/scanners" "default" False

  print
  print "Starting to install demo-apps..."
  print "Do you want to install the demo apps in a separate namespace? Otherwise they will be installed into the [default] namespace [y/N]"
  read -r line
  NAMESPACE="default"
  if [[ $line == *[Yy] ]]; then
    print "Please provide a name for the namespace:"
    read -r NAMESPACE
    kubectl create namespace "$NAMESPACE" || print "Namespace already exists or could not be created.. "
  fi

  installResources "$BASE_DIR/demo-apps" "$NAMESPACE" False

  print
  print "Starting to install hooks..."
  installResources "$BASE_DIR/hooks" "default" False

  print
  print "$COLOR_OK" "Information about your cluster:"
  kubectl get namespaces
  print
  kubectl get scantypes
  print
  kubectl get pods

  print
  print "$COLOR_OK" "Finished installation successfully!"
}

function unattendedInstall() {
  if [[ -n "${INSTALL_SCANNERS}" ]]; then
    print "Starting to install scanners..."
    installResources "$BASE_DIR/scanners" "default" True
  fi

  if [[ -n "${INSTALL_DEMO_APPS}" ]]; then
    print "Starting to install demo-apps..."
    installResources "$BASE_DIR/demo-apps" "default" True
  fi

  if [[ -n "${INSTALL_HOOKS}" ]]; then
    print "Starting to install hooks..."
    installResources "$BASE_DIR/hooks" "default" True
  fi

  print "$COLOR_OK" "Finished installation successfully!"
}

function parseArguments() {
  if [[ $# == 0 ]]; then
      INSTALL_INTERACTIVE=true
      return
  fi

  while (( "$#" )); do
        case "$1" in
          --scanners)
            INSTALL_SCANNERS='true'
            shift # Pop current argument from array
            ;;
          --demo-apps)
            INSTALL_DEMO_APPS='true'
            shift
            ;;
          --hooks)
            INSTALL_HOOKS='true'
            shift
            ;;
          --all)
            INSTALL_SCANNERS='true'
            INSTALL_DEMO_APPS='true'
            INSTALL_HOOKS='true'
            shift
            ;;
          -h|--help)
            printHelp
            exit
            ;;
          --*) # unsupported flags
            print "Error: Unsupported flag $1" >&2
            print "$USAGE"
            exit 1
            ;;
          *) # preserve positional arguments
            shift
            ;;
        esac
  done
}

# Main Script:
parseArguments "$@"

print "$COLOR_HIGHLIGHT" "                                                                             "
print "$COLOR_HIGHLIGHT" "                               _____           _      ____                   "
print "$COLOR_HIGHLIGHT" "                              / ____|         | |    |  _ \                  "
print "$COLOR_HIGHLIGHT" "  ___  ___  ___ _   _ _ __ ___| |     ___   __| | ___| |_) | _____  __       "
print "$COLOR_HIGHLIGHT" " / __|/ _ \/ __| | | | '__/ _ \ |    / _ \ / _  |/ _ \  _ < / _ \ \/ /       "
print "$COLOR_HIGHLIGHT" " \__ \  __/ (__| |_| | | |  __/ |___| (_) | (_| |  __/ |_) | (_) >  <        "
print "$COLOR_HIGHLIGHT" " |___/\___|\___|\__,_|_|  \___|\_____\___/ \__,_|\___|____/ \___/_/\_\       "
print "$COLOR_HIGHLIGHT" "                                                                             "

parseArguments "$@"
if [[ -n "${INSTALL_INTERACTIVE}" ]]; then
  welcomeToInteractiveInstall
fi

exitIfKubectlIsNotInstalled
exitIfHelmIsNotInstalled
createNamespaceAndInstallOperator

if [[ -n "${INSTALL_INTERACTIVE}" ]]; then
    interactiveInstall
  else
    unattendedInstall
fi

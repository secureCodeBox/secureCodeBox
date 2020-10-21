#!/usr/bin/env bash

set -eu
shopt -s extglob

echo -e "\e[32mWelcome to the secureCodeBox!\e[0m"
echo -e "This interactive installation script will guide you through all the relevant installation steps in order to have you ready to scan."

echo -e "Start ? [y/n]"
read -r line
if [[ $line == *[Yy] ]]; then
  echo -e "Starting!"
else
  exit
fi

echo
echo -e "Checking kubectl.."
kube=$(kubectl version)
if [[ $kube == *"GitVersion"* ]]; then
  echo -e "\e[32mIt's there!\e[0m"
else
  echo -e "\e[31mKubectl not found, quitting..\e[0m"
  exit
fi

echo
echo -e "Creating namespace securecodebox-system"
kubectl create namespace securecodebox-system || echo -e "Namespace already exists.. "

[ -z "${SCRIPT_DIRECTORY:-}" ] \
  && SCRIPT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )" \
  && export SCRIPT_DIRECTORY

cd "$SCRIPT_DIRECTORY"
cd ..

echo -e "Installing the operator in the securecodebox-system namespace"
helm -n securecodebox-system upgrade --install securecodebox-operator ./operator/ && echo -e "\e[32mSuccessfully installed the operator!\e[0m" \
  || (echo -e "\e[31mOperator installation failed, cancelling..\e[0m" && exit)


# $1: resourceName, $2: namespace
function installResources() {
  cd "$1"
  resources=()
  for directory in */ ; do
    resources+=("${directory::-1}")
  done

  for resource in "${resources[@]}"
  do
  while true
  echo -e "Do you want to install $resource? [y/n/(r)eadme]"
  do
    read -r line
    # Install:
    if [[ $line == *[Yy] ]]; then
      resourceName="${resource//+([_])/-}" # Necessary because ssh_scan is called ssh-scan
      helm upgrade --install -n "$2" "$resourceName" ./"$resource"/ || echo -e "\e[31mInstallation of ""$resource"" failed\e[0m"
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

  echo
  echo -e "\e[32mCompleted to install $1!\e[0m"
}

echo
echo -e "Starting to install scanners.."
installResources "scanners" "default"
cd ..

echo
echo -e "Starting to install demo-apps.."
echo -e "Do you want to install the demo apps in a separate namespace? Otherwise they will be installed into the [default] namespace [y/n]"
read -r line
namespace="default"
if [[ $line == *[Yy] ]]; then
  echo -e "Please provide a name for the namespace:"
  read -r namespace
  kubectl create namespace "$namespace" || echo -e "Namespace already exists or could not be created.. "
fi

installResources "demo-apps" "$namespace"
cd ..

echo
echo -e "Starting to install hooks.."
installResources "hooks" "default"
cd ..

echo
echo -e "\e[32mInformation about your cluster:\e[0m"
kubectl get namespaces
echo
kubectl get scantypes
echo
kubectl get pods

echo
echo -e "\e[32mFinished installation successfully!\e[0m"

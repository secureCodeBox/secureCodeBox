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

if [[ $PWD == *"bin" ]]; then
  cd ..
fi
echo -e "Installing the operator in the securecodebox-system namespace"
helm -n securecodebox-system upgrade --install securecodebox-operator ./operator/ || echo -e "\e[31mOperator installation failed, cancelling..e[0m"
echo -e "\e[32mSuccessfully installed the operator!\e[0m"

echo
echo -e "Starting to install scanners.."
cd scanners
scanners=()
for directory in */ ; do
    scanners+=("${directory::-1}")
done

for scanner in "${scanners[@]}"
do
  while true
  echo -e "Do you want to install $scanner? [y/n/(r)eadme]"
  do
    read -r line
    if [[ $line == *[Yy] ]]; then
      scannerName="${scanner//+([_])/-}" # Necessary because ssh_scan is called ssh-scan
      helm upgrade --install "$scannerName" ./"$scanner"/ || echo -e "\e[31mInstallation of ""$scannerName"" failed\e[0m"
      break
    elif [[ $line == *[r] ]]; then
      grep '' ./"$scanner"/README.md
      elif [[ $line == *[Nn] ]]; then
        break
    fi
  done
done

echo
echo -e "\e[32mCompleted to install scanners!\e[0m"

echo
echo -e "Starting to install demo-apps.."
echo -e "Do you want to install the demo apps in a separate namespace? Otherwise they will be installed into the [default] namespace [y/n]"
read -r line
namespace="default"
if [[ $line == *[Yy] ]]; then
  echo -e "Please provide a name for the namespace:"
  read -r namespace
  kubectl create namespace "$namespace" || echo -e "Namespace already exists.. "
fi

cd ../demo-apps
demos=()
for directory in */ ; do
    demos+=("${directory::-1}")
done

for demo in "${demos[@]}"
do
  while true
  echo -e "Do you want to install $demo? [y/n/(r)eadme]"
  do
    read -r line
    if [[ $line == *[Yy] ]]; then
      helm upgrade --install -n "$namespace" "$demo" ./"$demo"/ || echo -e "\e[31mInstallation of ""$demo"" failed\e[0m"
      break
    elif [[ $line == *[r] ]]; then
      grep '' ./"$demo"/README.md
      elif [[ $line == *[Nn] ]]; then
        break
    fi
  done
done

echo
echo -e "\e[32mCompleted to install demo-apps!\e[0m"

echo
echo -e "Starting to install hooks.."
cd ../hooks
hooks=()
for directory in */ ; do
    hooks+=("${directory::-1}")
done
for hook in "${hooks[@]}"
do
  while true
  echo -e "Do you want to install $hook? [y/n/(r)eadme]"
  do
    read -r line
    if [[ $line == *[Yy] ]]; then
      helm upgrade --install "$hook" ./"$hook"/ || echo -e "\e[31mInstallation of ""$hook"" failed\e[0m"
      break
    elif [[ $line == *[r] ]]; then
      grep '' ./"$hook"/README.md
      elif [[ $line == *[Nn] ]]; then
        break
    fi
  done
done

echo
echo -e "\e[32mCompleted to install hooks!\e[0m"

echo
echo -e "\e[32mInformation about your cluster:\e[0m"
kubectl get namespaces
echo
kubectl get scantypes
echo
kubectl get pods

echo
echo -e "\e[32mFinished installation successfully!\e[0m"

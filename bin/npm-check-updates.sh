#!/bin/bash
#
# Applies all MINOR updates to all `package.json` files using `ncu -u -t minor`
# in the repository and updates
# the `package-lock.json` using `npm i`

pkgs=$(find . -type f -name package-lock.json)
for pkg in $pkgs; do
  dir=$(dirname $pkg)
  cd $dir
  ncu -u -t minor
  npm i
done

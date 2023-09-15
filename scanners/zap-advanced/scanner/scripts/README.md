<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# ZAP Scripts

This folder contains ZAP scripts. The scripts must be in subdirectories named after the
relevant script type (such as "active", "passive", "authentication", etc.) and must have
an appropriate extension for the script language used.

## Naming Schema

Our custom ZAP scripts follow a naming schema:

- always lowercase,
- only dash (`-`) no underscore (`_`),
- always start with the prefix `scb-`,
- then describe the protocol, type or such (eg. oidc, basic-auth, propretary, etc.), and
- a short descriptive part.

## How to add them in the Desktop UI

1. Click the plus sign in the left panel beneath the "Site" tab.
2. Click ob the popping up "Scripts".
3. Click on the gearwheel of the new "Scripts" tab.
4. Click "Add..." in the popping up "Options" dialog.
5. Navigate to this folder and select it.
6. Click "OK" in the "Options" dialog.
7. The scripts should appear in the according category.

You can either edit the script in ZAP or in your favorite editor.

## Setup the Authentication Scripts in the Desktop UI

1. Double click your context for editing.
2. Go to "Authentication"
   1. Select "Script based Authentication" in the dropdown.
   2. Select "oidc-grandtype-password-auth.js" in the script dropdown"
   3. Click "Load".
   4. TODO doc the params
3. Go to Users
   1. Click "Add..."
   2. Fill the form with the basic auth user credentials from LastPass.
   3. Click "Add".
4. Go to "Session Management"
   1. Select "Script based Session Management" in the dropdown.
   2. Click "Load".
5. Click "OK"

## Various Links

- <https://www.zaproxy.org/docs/desktop/addons/script-console/>
- <https://medium.com/@omerlh/how-to-scripting-owasp-zap-with-javascript-1c1898b1e7e0>

#!/bin/sh
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Gitleaks Entrypoint Script to avoid problems gitleaks exiting with a non zero exit code
# This would cause the kubernetes job to fail no matter what
echo '[]' > /home/securecodebox/report.json # If no leaks found the file is not created
gitleaks $@
exit 0

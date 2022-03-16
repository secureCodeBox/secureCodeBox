# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# Sslyze Entrypoint Script to avoid problems with sslyze exiting with a non zero exit code
# sslyze returns a non zero exit code every time, when the scanned target is not compliant
# This would cause the kubernetes job to fail no matter what

python -m sslyze $@
exit 0

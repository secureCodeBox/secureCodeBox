# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Nikto Entrypoint Script to avoid problems nikto exiting with a non zero exit code
# This would cause the kubernetes job to fail no matter what
nikto.pl $@
exit 0

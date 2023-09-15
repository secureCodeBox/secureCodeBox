# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
set -e
doggo $@ --json | tee /home/securecodebox/doggo-results.json
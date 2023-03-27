# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0
set -e
doggo $@ --json | tee /home/securecodebox/doggo-results.json
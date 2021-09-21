# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

python3 /home/cmseek/cmseek.py "$@"

#TODO Check if result file exists
mv /home/cmseek/Result/*/cms.json /home/securecodebox/cmseek.json
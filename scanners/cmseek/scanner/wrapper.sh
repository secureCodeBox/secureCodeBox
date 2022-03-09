# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

python3 /home/cmseek/cmseek.py "$@"


# Find how many files with the JSON extension in Result folder are.
lines=$(find /home/cmseek/Result/ -type f -name "*.json"| wc -l)

#The cmseek scanner names the folder where the result is, the target url. That is why it's replaced with a wildcard here.
if [ $lines -eq 1 ]; then
mv /home/cmseek/Result/*/cms.json /home/securecodebox/cmseek.json
fi
# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

python3 typo3scan.py --no-interaction --json $@

if [ -f ./typo3scan.json ]; then  
    mv ./typo3scan.json /home/securecodebox/typo3scan-results.json
fi

exit 0

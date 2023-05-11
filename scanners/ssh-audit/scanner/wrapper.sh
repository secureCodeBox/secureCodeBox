# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

/home/sshaudit/ssh-audit.py -j "$@" >> /home/securecodebox/ssh-audit.json
exit_code=$?

# Exit Code 1 describes an error with the connection to the target
# Exit Code -1 describes an unknown error
if [ $exit_code -eq 1 ] || [ $exit_code -eq -1 ]
then
    echo $(cat /home/securecodebox/ssh-audit.json)
    rm /home/securecodebox/ssh-audit.json
    exit $exit_code
else 
    exit 0
fi

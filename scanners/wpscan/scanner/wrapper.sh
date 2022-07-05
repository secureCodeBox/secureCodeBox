# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

wpscan $@
wpscan_exit=$?
echo "wpscan exited with $wpscan_exit"

# wpscan returns a non zero exit code when it finds vulnerabilitys
# exit codes 1, 2 ,3 and 4 are errors, 5 means vulnerabilitys were found
# see https://github.com/wpscanteam/CMSScanner/blob/master/lib/cms_scanner/exit_code.rb
fake_exit_code=0
if [[ $wpscan_exit -eq 1 ]] || [[ $wpscan_exit -eq 2 ]] || [[ $wpscan_exit -eq 3 ]] || [[ $wpscan_exit -eq 4 ]]
then
    fake_exit_code=$wpscan_exit
fi

exit $fake_exit_code
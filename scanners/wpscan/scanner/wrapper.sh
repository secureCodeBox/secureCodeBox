# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

wpscan $@
echo "wpscan exited with $?"

# wpscan returns a non zero exit code when it finds vulnerabilitys
# see https://github.com/wpscanteam/CMSScanner/blob/master/lib/cms_scanner/exit_code.rb
exit 0

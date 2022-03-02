# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Screnshooter entrypoint script to change the result file linux permission after completion.
# Firefox will set the permission in a way which makes it inaccessible to the lurker otherwise
# Gets executed two times because it happened to produce better results for long loading sites
timeout 30 firefox $@
timeout 30 firefox $@
if [ ! -f /home/securecodebox/screenshot.png ]; then
    touch /home/securecodebox/screenshot.png
fi
chmod a=r /home/securecodebox/screenshot.png
exit 0

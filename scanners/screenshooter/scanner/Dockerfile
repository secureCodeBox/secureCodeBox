# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# This is using debian rather than alpine, as firefox on alpine seems to be missing some crucial fonts.
# This lets the screenshots taken on alpine look weird
FROM debian:12.0
RUN apt-get update && apt-get install firefox-esr -y
RUN groupadd -g 1001 screenshooter \
    && useradd -M -u 1001 -g 1001 securecodebox
COPY wrapper.sh ./
USER 1001
ENTRYPOINT ["sh","wrapper.sh"]

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# This is using ubuntu rather than alpine, as firefox on alpine seems to be missing some crucial fonts.
# This lets the screenshots taken on alpine look weird
FROM ubuntu
RUN apt-get update && apt-get install firefox -y
RUN groupadd -g 1001 screenshooter \
    && useradd -M -u 1001 -g 1001 screenshooter
COPY wrapper.sh ./
USER 1001
ENTRYPOINT ["sh","wrapper.sh"]

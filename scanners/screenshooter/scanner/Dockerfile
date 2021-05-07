# SPDX-FileCopyrightText: 2020 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# This is using ubuntu rather than alpine, as firefox on alpine seems to be missing some crucial fonts.
# This lets the screenshots taken on alpine look weird
FROM ubuntu
RUN apt-get update && apt-get install firefox -y
COPY wrapper.sh ./
ENTRYPOINT ["sh","wrapper.sh"]

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM debian:latest

RUN apt-get update \
    && apt-get install whatweb -y \
    && rm -rf /var/lib/apt/lists/*

USER 1001
CMD ["whatweb"]
#0.4.9

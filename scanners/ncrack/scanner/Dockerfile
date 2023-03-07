# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM ubuntu:20.04
ARG scannerVersion

RUN apt-get update \
    && apt-get install ncrack=$scannerVersion+debian-1build1 -y \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 ncrack \
    && useradd -M -u 1001 -g 1001 ncrack
USER 1001
CMD [ "ncrack" ]


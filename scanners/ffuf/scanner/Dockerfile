# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Write your dockerfile for the scanner ffuf here
# Alternatively, you can use an existing image from docker-hub
FROM golang:1.19-alpine
ARG scannerVersion=v1.5.0
ARG secListVersion=2022.3
RUN apk add git \
    && git clone https://github.com/danielmiessler/SecLists.git --depth 1 --branch $secListVersion
RUN go install github.com/ffuf/ffuf@$scannerVersion
RUN addgroup --system --gid 1001 ffuf && adduser ffuf --system --uid 1001 --ingroup ffuf
USER 1001
CMD ["ffuf"]
# todo rn: maybe we need call it with ~/go/bin/ffuf

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.15
ARG scannerVersion=latest
RUN apk add --no-cache nmap=$scannerVersion nmap-scripts=$scannerVersion
RUN addgroup --system --gid 1001 nmap && adduser nmap --system --uid 1001 --ingroup nmap
USER 1001
CMD [nmap]

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Write your dockerfile for the scanner ffuf here
# Alternatively, you can use an existing image from docker-hub
FROM golang:1.19-alpine
ARG scannerVersion
RUN go install github.com/ffuf/ffuf/v2@$scannerVersion
RUN addgroup --system --gid 1001 ffuf && adduser ffuf --system --uid 1001 --ingroup ffuf
RUN mkdir -p /home/ffuf/.config/ffuf && chown -R ffuf:ffuf /home/ffuf/.config/ffuf
RUN mkdir -p /home/ffuf/.config/ffuf/scraper && chown -R ffuf:ffuf /home/ffuf/.config/ffuf/scraper
USER 1001

CMD ["ffuf"]

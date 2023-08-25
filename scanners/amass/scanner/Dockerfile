# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Base Image
FROM alpine:3.18 as base
ARG scannerVersion

RUN apk add --no-cache wget unzip \
    && wget https://github.com/owasp-amass/amass/releases/download/${scannerVersion}/amass_Linux_i386.zip \
    && unzip amass_Linux_i386.zip \
    && rm amass_Linux_i386.zip

# Runtime Image
FROM alpine:3.18 as runtime

RUN apk --no-cache add ca-certificates pax-utils \
    && addgroup amass \
    && adduser amass -D -G amass \
    && mkdir -p /.config/amass /home/securecodebox/ \
    && chown -R amass:amass /.config /home/securecodebox/

COPY --from=base amass_Linux_i386/amass /bin/amass

ENV HOME=/
USER amass
ENTRYPOINT ["/bin/amass"]

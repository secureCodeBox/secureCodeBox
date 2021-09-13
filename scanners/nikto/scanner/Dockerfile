# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.14 as build
ARG scannerVersion
RUN apk add git
RUN git clone --depth 1 --branch "nikto-$scannerVersion" https://github.com/sullo/nikto.git /nikto

FROM alpine:3.14

ENV  PATH=${PATH}:/nikto

COPY wrapper.sh /wrapper.sh

RUN apk add --update --no-cache --virtual .build-deps \
     perl \
     perl-net-ssleay \
  && addgroup nikto \
  && adduser -G nikto -s /bin/sh -D nikto

COPY --from=build --chown=nikto:nikto /nikto/program /nikto

USER nikto

ENTRYPOINT [ "sh", "/wrapper.sh" ]

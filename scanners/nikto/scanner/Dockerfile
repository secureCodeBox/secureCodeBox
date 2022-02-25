# SPDX-FileCopyrightText: the secureCodeBox authors
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
  && addgroup -g 1001 nikto \
  && adduser -G nikto -s /bin/sh -D -u 1001 nikto

COPY --from=build --chown=nikto:nikto /nikto/program /nikto

USER 1001 

ENTRYPOINT [ "sh", "/wrapper.sh" ]

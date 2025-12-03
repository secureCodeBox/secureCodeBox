# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.23 AS build
ARG scannerVersion
RUN apk add git
RUN git clone --depth 1 https://github.com/sullo/nikto.git /nikto

FROM alpine:3.23

ENV PATH=${PATH}:/nikto

COPY --chown=root:root --chmod=755 wrapper.sh /wrapper.sh

RUN apk add --update --no-cache --virtual .build-deps \
     perl \
     perl-net-ssleay \
  && addgroup -g 1001 nikto \
  && adduser -G nikto -s /bin/sh -D -u 1001 nikto

COPY --from=build --chown=root:root --chmod=755 /nikto/program /nikto

USER 1001

ENTRYPOINT [ "sh", "/wrapper.sh" ]

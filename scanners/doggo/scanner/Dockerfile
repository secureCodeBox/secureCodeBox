# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

ARG scannerVersion

FROM ghcr.io/mr-karan/doggo:$scannerVersion

COPY wrapper.sh /wrapper.sh

USER root

RUN mkdir /home/securecodebox/

RUN addgroup --system --gid 1001 doggo && adduser doggo --system --uid 1001 --ingroup doggo
RUN chown doggo /home/securecodebox/ && chgrp doggo /home/securecodebox/
USER 1001

ENTRYPOINT [ "sh", "/wrapper.sh" ]

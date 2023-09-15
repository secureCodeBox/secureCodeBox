# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

ARG scannerVersion

FROM nablac0d3/sslyze:$scannerVersion

COPY wrapper.sh /wrapper.sh

USER root

RUN mkdir /home/securecodebox/

USER sslyze

ENTRYPOINT [ "sh", "/wrapper.sh" ]

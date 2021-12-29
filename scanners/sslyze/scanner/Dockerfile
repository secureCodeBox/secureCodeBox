# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

ARG scannerVersion=5.0.0

FROM nablac0d3/sslyze:$scannerVersion

COPY wrapper.sh /wrapper.sh

USER root

RUN mkdir /home/securecodebox/

USER sslyze

ENTRYPOINT [ "sh", "/wrapper.sh" ]


# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

ARG scannerVersion

FROM wpscanteam/wpscan:$scannerVersion

COPY wrapper.sh /wrapper.sh

USER root

RUN mkdir /home/securecodebox/

USER wpscan

ENTRYPOINT [ "sh", "/wrapper.sh" ]

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

ARG scannerVersion=latest
FROM projectdiscovery/subfinder:${scannerVersion}

RUN addgroup --system --gid 1001 subfinder && adduser subfinder --system --uid 1001 --ingroup subfinder -h /home/securecodebox/

USER 1001

ENTRYPOINT [ "subfinder" ]


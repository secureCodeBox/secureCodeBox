# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Base Image
ARG scannerVersion  
FROM positronsecurity/ssh-audit:${scannerVersion}

COPY wrapper.sh /wrapper.sh

USER root
RUN mkdir /home/securecodebox/

# Create ssh-audit user/group and give access
RUN addgroup --system --gid 1001 sshaudit && adduser sshaudit --system --uid 1001 --ingroup sshaudit
RUN chown sshaudit /home/securecodebox

USER 1001

# Switch work dir to scb folder so that the results get written there, and its available for local docker runs.
WORKDIR /home/securecodebox/

ENTRYPOINT [ "sh" "/wrapper.sh" ]

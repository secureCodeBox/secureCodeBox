# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Base Image
ARG scannerVersion  
FROM positronsecurity/ssh-audit:${scannerVersion}

COPY wrapper.sh /wrapper.sh

# root user for creating new user to avoid permission denied error
USER root

# Create ssh-audit user/group and give access
RUN addgroup --system --gid 1001 sshaudit && adduser sshaudit --system --uid 1001 --ingroup sshaudit && \
mkdir /home/securecodebox/ && chown sshaudit /home/securecodebox

USER 1001

# Switch workdir to scb folder so that the results get written there and its available for local docker runs.
WORKDIR /home/securecodebox/

ENTRYPOINT [ "sh" "/wrapper.sh" ]

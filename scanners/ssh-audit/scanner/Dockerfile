# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Base Image
FROM python:3.9-alpine as base  
ARG scannerVersion              

# Install git and Clone Repo 
RUN apk add git \
    && git clone https://github.com/jtesta/ssh-audit.git  --depth 1 --branch ${scannerVersion}\
    && cd ssh-audit \
    && rm -r .git .github

# Runtime Image
FROM python:3.9-alpine as runtime

# Create ssh-audit user/group and give access
RUN addgroup --system --gid 1001 sshaudit && adduser sshaudit --system --uid 1001 --ingroup sshaudit
COPY --from=base --chown=1001:1001 /ssh-audit /home/sshaudit/
COPY wrapper.sh /wrapper.sh

# Switch work dir to scb folder so that the results get written there, and its available for local docker runs.
WORKDIR /home/securecodebox/

USER 1001

ENTRYPOINT [ "sh" "/wrapper.sh" ]

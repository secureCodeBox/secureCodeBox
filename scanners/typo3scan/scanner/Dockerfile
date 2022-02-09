# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Base Image
FROM python:3.9-alpine as base
ARG scannerVersion
# Install git and Clone Repo 
RUN apk add git \
    && git clone https://github.com/whoot/Typo3Scan.git --depth 1 --branch "$scannerVersion" \
    && cd Typo3Scan \
    && rm -r .git .github doc

# Runtime Image
FROM python:3.9-alpine as runtime

# Create typo3scan user/group and give access
RUN addgroup --system --gid 1001 typo3scan && adduser typo3scan --system --uid 1001 --ingroup typo3scan
COPY --from=base --chown=1001:1001 /Typo3Scan /home/typo3scan/

WORKDIR /home/typo3scan/

# Install Typo3Scan python requirements
RUN python3 -m pip install -r requirements.txt

# Switch work dir to scb folder so that the results get written there, and its available for local docker runs.
WORKDIR /home/securecodebox/

USER 1001

ENTRYPOINT [ "python3", "/home/typo3scan/typo3scan.py" ]
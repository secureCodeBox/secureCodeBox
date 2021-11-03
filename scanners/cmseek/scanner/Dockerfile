# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# Base Image
FROM python:3.9-alpine as base
ARG scannerVersion
# Install git and Clone Repo 
RUN apk add git \
    && git clone https://github.com/Tuhinshubhra/CMSeeK.git --depth 1 --branch $scannerVersion \
    && cd CMSeeK \
    && rm -r .git

# Runtime Image
FROM python:3.9-alpine as runtime

# Create cmseek user/group and give access
RUN addgroup --system --gid 1001 cmseek && adduser cmseek --system --uid 1001 --ingroup cmseek
COPY --from=base --chown=1001:1001 /CMSeeK /home/cmseek/
COPY  --chown=1001:1001 wrapper.sh /home/cmseek/

# Create folder for scan output
RUN mkdir /home/securecodebox/ && chown -R cmseek:cmseek /home/securecodebox/

# Switch to cmseek user
USER 1001
WORKDIR /home/cmseek/

# Create folder required by the scanner
RUN mkdir /home/cmseek/Result

# Install Typo3Scan python requirements
RUN python3 -m pip install -r requirements.txt

ENTRYPOINT [ "sh", "/home/cmseek/wrapper.sh" ]

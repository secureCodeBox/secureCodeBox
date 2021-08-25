# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

#Base Image
FROM python:3.9-alpine as base

#Install git and Clone Repo 
RUN apk add git \
    && git clone https://github.com/whoot/Typo3Scan.git \
    && cd Typo3Scan \
    && rm -r .git .github doc
COPY wrapper.sh /Typo3Scan/wrapper.sh

#Runtime Image
FROM python:3.9-alpine as runtime

#Create typo3scan user/group and give access
RUN addgroup --system --gid 1001 typo3scan && adduser typo3scan --system --uid 1001 --ingroup typo3scan
COPY --from=base /Typo3Scan /home/typo3scan/Typo3Scan
RUN mkdir /home/securecodebox/ \
    && chown -R typo3scan:typo3scan /home/securecodebox/ /home/typo3scan/
USER 1001
WORKDIR /home/typo3scan/Typo3Scan

#Install Typo3Scan python requirements
RUN python3 -m pip install -r requirements.txt

ENTRYPOINT [ "sh", "./wrapper.sh" ]
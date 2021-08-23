# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.12

#Install Python3
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

#Install git 
RUN apk add git

#Create typo3scan user/group and give access
RUN addgroup --system --gid 1001 typo3scan && adduser typo3scan --system --uid 1001 --ingroup typo3scan
RUN mkdir /home/securecodebox/
RUN chown -R typo3scan:typo3scan /home/securecodebox/
USER 1001

#Clone Repo 
WORKDIR /home/typo3scan/
RUN git clone https://github.com/whoot/Typo3Scan.git
WORKDIR /home/typo3scan/Typo3Scan

#Install Typo3Scan python requirements
RUN python3 -m pip install -r requirements.txt
COPY wrapper.sh ./wrapper.sh

ENTRYPOINT [ "sh", "./wrapper.sh" ]
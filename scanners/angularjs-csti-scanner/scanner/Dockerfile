# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM python:3.6-alpine
ARG scannerVersion

RUN apk add --update --no-cache g++ gcc libxslt-dev 
RUN adduser -S -H -u 1001 angularjscsti

COPY acstis-script.py /home/angularjscsti/acstis/acstis-script.py
COPY wrapper.sh /home/angularjscsti/wrapper.sh

RUN pip install https://github.com/tijme/angularjs-csti-scanner/archive/$scannerVersion.zip \
    && chown -R angularjscsti /home/angularjscsti
    
USER 1001

ENTRYPOINT [ "sh", "/home/angularjscsti/wrapper.sh" ]

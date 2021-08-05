# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM python:3.6-alpine
ARG scannerVersion
COPY acstis-script.py /acstis/acstis-script.py
COPY wrapper.sh /wrapper.sh
RUN apk add --update --no-cache g++ gcc libxslt-dev
RUN pip install https://github.com/tijme/angularjs-csti-scanner/archive/$scannerVersion.zip
ENTRYPOINT [ "sh", "/wrapper.sh" ]

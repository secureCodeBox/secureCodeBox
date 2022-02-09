# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.11

RUN apk add --no-cache curl bash

RUN addgroup -S app && adduser -S -G app app 
USER app

WORKDIR /home/dashboard-importer/

COPY dashboards/ ./dashboards/
COPY import-dashboards.sh ./

CMD [ "bash", "import-dashboards.sh" ]

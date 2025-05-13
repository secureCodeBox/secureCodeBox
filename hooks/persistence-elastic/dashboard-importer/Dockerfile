# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.21

RUN apk add --no-cache curl bash

RUN addgroup -S app && adduser -S -G app app 
USER app

WORKDIR /home/dashboard-importer/

COPY --chown=root:root --chmod=755 dashboards/ ./dashboards/
COPY --chown=root:root --chmod=755 import-dashboards.sh ./

CMD [ "bash", "import-dashboards.sh" ]

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

ARG baseImageTag
ARG namespace
FROM ${namespace:-securecodebox}/parser-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/parser-wrapper/parser/
COPY --chown=app:app ./parser.js ./parser.js

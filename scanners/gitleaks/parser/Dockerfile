# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

# Commented out the dependency management as there are no dependencies in the
# parser at the moment. Add the commented-out parts of the Dockerfile again
# if the parser starts needing packages once again.
ARG namespace
ARG baseImageTag
# FROM node:16-alpine as build
# RUN mkdir -p /home/app
# WORKDIR /home/app
# COPY package.json package-lock.json ./
# RUN npm ci --production

FROM ${namespace:-securecodebox}/parser-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/parser-wrapper/parser/
# COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --chown=app:app ./parser.js ./parser.js

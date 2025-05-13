# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Commented out the dependency management as there are no dependencies in the
# parser at the moment. Add the commented-out parts of the Dockerfile again
# if the parser starts needing packages once again.
ARG namespace
ARG baseImageTag
# FROM node:22-alpine as build
# RUN mkdir -p /home/app
# WORKDIR /home/app
# COPY package.json package-lock.json ./
# RUN npm ci --production

FROM ${namespace:-securecodebox}/parser-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/parser-wrapper/parser/
COPY --chown=root:root --chmod=755 ./parser.js ./parser.js

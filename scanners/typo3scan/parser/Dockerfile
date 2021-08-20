# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

ARG namespace
ARG baseImageTag
FROM node:12-alpine as build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM securecodebox/parser-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/parser-wrapper/parser/
#COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/ # TODO No external Dependencies are installed (so no node_modules folder)
COPY --chown=app:app ./parser.js ./parser.js
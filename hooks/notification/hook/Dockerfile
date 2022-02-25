# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

ARG namespace
ARG baseImageTag
FROM node:16-alpine as install
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:16-alpine as build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci
COPY ./ ./
RUN npm run build && rm -rf node_modules

FROM ${namespace:-securecodebox}/hook-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/hook-wrapper/hook/
COPY --from=install --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --from=build --chown=app:app /home/app/ ./

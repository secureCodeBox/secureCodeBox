# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

ARG namespace
ARG baseImageTag
FROM node:14-alpine as install
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:14-alpine as build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci
COPY hook.ts scan-helpers.ts scope-limiter.ts kubernetes-label-selector.ts ./
RUN npm run build

FROM ${namespace:-securecodebox}/hook-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/hook-wrapper/hook/
COPY --from=install --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --from=build --chown=app:app /home/app/hook.js /home/app/hook.js.map /home/app/scan-helpers.js /home/app/scan-helpers.js.map /home/app/scope-limiter.js /home/app/scope-limiter.js.map /home/app/kubernetes-label-selector.js /home/app/kubernetes-label-selector.js.map ./

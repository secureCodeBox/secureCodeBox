# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

ARG namespace
ARG baseImageTag
FROM node:22-alpine AS install
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:22-alpine AS build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci
COPY ./ ./
RUN npm run build && rm -rf node_modules

FROM ${namespace:-securecodebox}/hook-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/hook-wrapper/hook/
COPY --from=install --chown=root:root --chmod=755 /home/app/node_modules/ ./node_modules/
COPY --from=build --chown=root:root --chmod=755 /home/app/ ./

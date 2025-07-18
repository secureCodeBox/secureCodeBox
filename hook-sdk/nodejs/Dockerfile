# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM oven/bun:1.2 AS build
WORKDIR /home/app/
COPY package.json package-lock.json ./
RUN bun install --ignore-scripts
COPY *.js ./
RUN bun run build

FROM node:22-alpine
ARG NODE_ENV
RUN addgroup --system --gid 1001 app && adduser app --system --uid 1001 --ingroup app
WORKDIR /home/app/hook-wrapper/
COPY --chown=root:root --chmod=755 ./package.json ./package-lock.json ./
COPY --from=build --chown=root:root --chmod=755 /home/app/build/ ./
USER 1001
ENV NODE_ENV=${NODE_ENV:-production}
ENTRYPOINT ["node", "--enable-source-maps", "/home/app/hook-wrapper/hook-wrapper.js"]

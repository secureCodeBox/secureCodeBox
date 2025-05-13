# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM node:22-alpine AS build
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:22-alpine
ARG NODE_ENV
RUN addgroup --system --gid 1001 app && adduser app --system --uid 1001 --ingroup app
WORKDIR /home/app/parser-wrapper/
COPY --from=build --chown=root:root --chmod=755 /home/app/node_modules/ ./node_modules/
COPY --chown=root:root --chmod=755 ./parser-wrapper.js ./parser-wrapper.js
COPY --chown=root:root --chmod=755 ./parser-utils.js ./parser-utils.js
COPY --chown=root:root --chmod=755 ./findings-schema.json ./findings-schema.json
USER 1001
ENV NODE_ENV=${NODE_ENV:-production}
ENTRYPOINT ["node", "/home/app/parser-wrapper/parser-wrapper.js"]

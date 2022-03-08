# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM node:16-alpine as build
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:16-alpine
ARG NODE_ENV
RUN addgroup --system --gid 1001 app && adduser app --system --uid 1001 --ingroup app
WORKDIR /home/app/parser-wrapper/
COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --chown=app:app ./parser-wrapper.js ./parser-wrapper.js
COPY --chown=app:app ./parser-utils.js ./parser-utils.js
COPY --chown=app:app ./findings-schema.json ./findings-schema.json
USER 1001
ENV NODE_ENV ${NODE_ENV:-production}
ENTRYPOINT ["node", "/home/app/parser-wrapper/parser-wrapper.js"]

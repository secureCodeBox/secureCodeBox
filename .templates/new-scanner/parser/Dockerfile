# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# No additional dependencies
ARG namespace
ARG baseImageTag
FROM ${namespace:-securecodebox}/parser-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/parser-wrapper/parser/
COPY --chown=app:app ./parser.js ./parser.js

# Additional packages
# ARG namespace
# ARG baseImageTag
# FROM node:16-alpine as build
# RUN mkdir -p /home/app
# WORKDIR /home/app
# COPY package.json package-lock.json ./
# RUN npm ci --production
#
# FROM ${namespace:-securecodebox}/parser-sdk-nodejs:${baseImageTag:-latest}
# WORKDIR /home/app/parser-wrapper/parser/
# COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
# COPY --chown=app:app ./parser.js ./parser.js

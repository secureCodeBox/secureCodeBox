---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Dockerfile
sidebar_position: 5
---

The Dockerfile for a hook looks like the following.
If you use the provided *hook-sdk*, you won't need to apply any changes to it.

```Dockerfile
ARG baseImageTag
FROM node:12-alpine as build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM securecodebox/hook-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/hook-wrapper/hook/
COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --chown=app:app ./hook.js ./hook.js
```

See [Local Deployment](/docs/contributing/local-deployment) for instructions on how to build and deploy your hook.

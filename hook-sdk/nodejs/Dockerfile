FROM node:12-alpine as build
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM securecodebox/scb-sdk:${baseImageTag:-latest}
ARG NODE_ENV
WORKDIR /home/app/hook-wrapper/
COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --chown=app:app ./hook-wrapper.js ./hook-wrapper.js
USER 1001
ENV NODE_ENV ${NODE_ENV:-production}
ENTRYPOINT ["node", "/home/app/hook-wrapper/hook-wrapper.js"]

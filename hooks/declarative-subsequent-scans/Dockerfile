FROM node:12-alpine as install
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:12-alpine as build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci
COPY hook.ts scan-helpers.js ./
RUN npm run build

FROM scbexperimental/hook-sdk-nodejs:latest
WORKDIR /home/app/hook-wrapper/hook/
COPY --chown=app:app scan-helpers.js ./
COPY --from=build --chown=app:app /home/app/hook.js ./
COPY --from=install --chown=app:app /home/app/node_modules/ ./node_modules/

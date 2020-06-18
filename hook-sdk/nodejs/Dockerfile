FROM node:12-alpine as build
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:12-alpine
ARG NODE_ENV
RUN addgroup -S app && adduser app -S -G app
WORKDIR /home/app/hook-wrapper/
COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --chown=app:app ./hook-wrapper.js ./hook-wrapper.js
USER app
ENV NODE_ENV ${NODE_ENV:-production}
ENTRYPOINT ["node", "/home/app/hook-wrapper/hook-wrapper.js"]
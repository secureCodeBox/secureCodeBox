FROM node:12-alpine as build
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:12-alpine
ARG NODE_ENV
RUN addgroup -S app && adduser app -S -G app
WORKDIR /home/app/
COPY --from=build --chown=app:app /home/app/node_modules/ ./node_modules/
COPY --chown=app:app ./src src/
USER app
EXPOSE 3000
ENV NODE_ENV ${NODE_ENV:-production}
ENTRYPOINT ["node", "/home/app/src/index.js"]
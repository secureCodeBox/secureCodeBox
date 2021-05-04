FROM node:14-buster-slim as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM gcr.io/distroless/nodejs:14
ARG NODE_ENV
WORKDIR /app
COPY --from=build /app/node_modules/ ./node_modules/
COPY ./hook-wrapper.js ./hook-wrapper.js
ENV NODE_ENV ${NODE_ENV:-production}
CMD ["hook-wrapper.js"]

FROM node:12-alpine

COPY package.json package-lock.json ./

RUN npm ci --production

COPY ./ ./

ENTRYPOINT ["node", "index.js"]
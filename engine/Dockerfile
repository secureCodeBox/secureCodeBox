FROM node:12-alpine

COPY package.json package-lock.json ./

RUN npm ci --production

COPY ./ ./

CMD ["node", "index.js"]
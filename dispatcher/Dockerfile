FROM node:12-alpine

COPY package.json package-lock.json ./

RUN npm ci --production

COPY ./ ./

EXPOSE 8080

CMD ["node", "index.js"]
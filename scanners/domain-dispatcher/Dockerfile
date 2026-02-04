FROM node:25.6.0-alpine

ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY ./src ./src
COPY ./index.js .
COPY ./.env.example .

USER node

CMD ["npm", "start", "--node-options=--dns-result-order=ipv4first"]

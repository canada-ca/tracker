FROM node:16-alpine

ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY ./src ./src
COPY ./index.js .
COPY ./.env.example .

USER node


CMD ["npm", "start"]

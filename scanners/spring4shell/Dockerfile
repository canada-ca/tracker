FROM node:18.18.0-alpine3.18

ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY ./src ./src
COPY ./index.js .
COPY ./.env.example .

USER node


CMD ["npm", "start"]

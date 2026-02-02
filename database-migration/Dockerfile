FROM node:25.5.0-alpine

ENV NODE_ENV production

WORKDIR /home/node/app

COPY package.json .
COPY package-lock.json .
COPY .env.example .
COPY index.js .
COPY database.json .

RUN npm ci

USER node

CMD ["npm", "start"]

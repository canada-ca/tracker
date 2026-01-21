FROM node:25.3.0-alpine

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

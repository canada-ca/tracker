FROM node:alpine

ENV NODE_ENV production

WORKDIR /home/node/app

COPY package.json .
COPY package-lock.json .
COPY .env.example .
COPY index.js .

RUN npm ci

USER node

CMD ["npm", "start"]

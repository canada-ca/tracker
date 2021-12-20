FROM node:alpine

ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

USER node

CMD ["npm", "start"]

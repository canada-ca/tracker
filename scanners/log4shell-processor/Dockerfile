FROM node:alpine

ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

USER node
EXPOSE 53

CMD ["npm", "start"]

FROM node:alpine

ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

USER node
EXPOSE 5353
EXPOSE 5454

CMD ["npm", "start"]

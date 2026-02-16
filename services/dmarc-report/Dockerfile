FROM node:25.6.1-alpine

ENV NODE_ENV production

WORKDIR /app

COPY src ./src
COPY index.js .
COPY package* ./
COPY database-options.js .
COPY ./.env.example .

RUN npm ci
RUN npm prune --production

USER node
CMD ["npm", "start"]

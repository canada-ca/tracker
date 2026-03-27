FROM node:25.8.2-alpine

ENV NODE_ENV production

WORKDIR /app
COPY src ./src
COPY index.js ./index.js
COPY package* ./
COPY database-options.js ./
COPY .env.example ./
RUN npm ci

USER node
CMD ["npm", "start"]

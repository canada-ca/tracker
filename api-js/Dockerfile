FROM node:14-alpine

ENV NODE_ENV production

WORKDIR /app
COPY src ./src
COPY index.js ./index.js
COPY package* ./
COPY migrations.js ./
RUN npm ci

USER node
EXPOSE 4000
CMD ["npm", "start"]
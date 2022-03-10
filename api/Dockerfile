# To build image: docker build --tag tracker-api:1.0 .
# To run image: docker run --network=host --env-file ./.env  tracker-api:1.0
# Build image
FROM node:alpine AS base

WORKDIR /app

FROM base AS builder

COPY package*.json .babelrc ./

RUN npm install

COPY ./src ./src
COPY ./index.js .
COPY ./database.json .
COPY ./.env.example .

RUN npm run build

RUN npm prune --production

# Prod image
FROM base AS release

ENV NODE_ENV production

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env.example .
COPY --from=builder /app/index.js .
COPY --from=builder /app/database.json .
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 4000

CMD ["npm", "start", "--node-options=--dns-result-order=ipv4first"]

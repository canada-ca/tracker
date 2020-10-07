# Build image
FROM node:14-alpine as build-env

WORKDIR /app

COPY . .

RUN npm ci --production

# Prod image
FROM node:14-alpine

ENV NODE_ENV production

COPY --from=build-env /app /app/dist

WORKDIR /app

USER node
EXPOSE 4000

CMD ["npm", "start"]

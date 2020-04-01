# Node-gyp needs python 🤦
FROM python:alpine as build-env
RUN apk add -U npm gcc make g++
WORKDIR /app
COPY . .

RUN npm ci
RUN npm run extract
RUN npm run compile
RUN npm run build

FROM node:13-alpine
LABEL maintainer="mike.williamson@cds-snc.ca"

ENV HOST 0.0.0.0
ENV PORT 3000
ENV NODE_ENV production

COPY --from=build-env /app /app
WORKDIR /app

USER node
EXPOSE 3000

CMD ["index.js"]

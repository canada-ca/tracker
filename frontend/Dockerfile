FROM node:13-alpine
LABEL maintainer="mike.williamson@cds-snc.ca"

WORKDIR /app
COPY . .

RUN npm ci
RUN npm run extract
RUN npm run compile

ENV NODE_ENV production
RUN npm run build

USER node

EXPOSE 3000
CMD ["npm", "start"]

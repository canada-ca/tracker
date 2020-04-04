FROM node:alpine

USER node
WORKDIR /home/node/differ
COPY . .

RUN npm i

ENTRYPOINT ["node", "./cli.js"]

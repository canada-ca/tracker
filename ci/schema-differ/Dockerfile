FROM node:alpine

USER node
WORKDIR /home/node/differ
COPY . .

RUN npm i

ENTRYPOINT ["node", "/home/node/differ/cli.js"]

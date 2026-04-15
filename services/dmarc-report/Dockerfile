FROM node:25.5.0-alpine AS production

ENV NODE_ENV production

WORKDIR /app

COPY package* ./
RUN npm ci --omit=dev

COPY --exclude=**/__tests__ \
     --exclude=**/__mocks__ \
     --exclude=**/testUtilities.js \
     src ./src
COPY index.js database-options.js .env.example ./

USER node
CMD ["npm", "start"]

#===============================================================================================

FROM production AS test

USER root
RUN npm install
COPY . .

USER node

#===============================================================================================

FROM production AS final

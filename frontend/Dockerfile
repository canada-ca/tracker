# Node-gyp needs python 🤦 so our build image needs to include it
FROM python:alpine as build-env
RUN apk add -U npm gcc make g++
WORKDIR /app
# Copy in whatever isn't filtered by .dockerignore
COPY . .

# Install only what's needed for production
# https://nodesecroadmap.fyi/chapter-1/threat-UIR.html
RUN npm ci --production

# Base the production image on something slimmer
FROM node:13-alpine
LABEL maintainer="mike.williamson@tbs-sct.gc.ca"

ENV HOST 0.0.0.0
ENV PORT 3000
ENV NODE_ENV production

# copy built app in
COPY --from=build-env /app /app
WORKDIR /app

USER node
EXPOSE 3000

CMD ["npm", "start"]

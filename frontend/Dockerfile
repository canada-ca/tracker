FROM node:alpine as build-env
WORKDIR /app
# Copy in whatever isn't filtered by .dockerignore
COPY . .

# Install only what's needed for production
# https://nodesecroadmap.fyi/chapter-1/threat-UIR.html
RUN npm ci --production

# Base the production image on something slimmer
FROM node:alpine
LABEL maintainer="mike.williamson@tbs-sct.gc.ca"
WORKDIR /app

ENV HOST 0.0.0.0
ENV PORT 3000

COPY . .
RUN npm i
RUN npm run build

# https://github.com/astefanutti/scratch-node
# FROM astefanutti/scratch-node
# Our build of the above:
FROM gcr.io/track-compliance/scratch-node:16.2.0
COPY --from=build-env /app /app
WORKDIR /app

ENV NODE_ENV production

USER node
EXPOSE 3000

ENTRYPOINT ["/bin/node"]
CMD ["index.js"]

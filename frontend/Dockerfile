FROM node:alpine as build-env

WORKDIR /app

# Copy in whatever isn't filtered by .dockerignore
COPY . .

RUN npm ci && npm run build && npm prune --production

# https://github.com/astefanutti/scratch-node
# FROM astefanutti/scratch-node
# Our build of the above:
FROM gcr.io/track-compliance/scratch-node:16.2.0
LABEL maintainer="mike.williamson@tbs-sct.gc.ca"

ENV HOST 0.0.0.0
ENV PORT 3000

WORKDIR /app

COPY --from=build-env /app .

ENV NODE_ENV production

USER node
EXPOSE 3000

ENTRYPOINT ["/bin/node"]
CMD ["index.js"]

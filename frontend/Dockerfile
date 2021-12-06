FROM node:17-alpine as build-env

WORKDIR /app

# Copy in whatever isn't filtered by .dockerignore
COPY . .

RUN npm ci && npm run build && npm prune --production

# https://github.com/astefanutti/scratch-node
FROM astefanutti/scratch-node:17
LABEL maintainer="mike.williamson@tbs-sct.gc.ca"

ENV HOST 0.0.0.0
ENV PORT 3000

WORKDIR /app

COPY --from=build-env /app .

ENV NODE_ENV production
# https://github.com/webpack/webpack/issues/14532#issuecomment-947012063
ENV NODE_OPTIONS=--openssl-legacy-provider

USER node
EXPOSE 3000

ENTRYPOINT ["/bin/node"]
CMD ["index.js"]

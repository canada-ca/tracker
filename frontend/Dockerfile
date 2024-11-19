FROM node:23.2-alpine3.19 as build-env

WORKDIR /app

# Copy in whatever isn't filtered by .dockerignore
COPY . .

RUN npm ci && npm run build && npm prune --production

FROM gcr.io/distroless/nodejs20-debian12

ENV HOST 0.0.0.0
ENV PORT 3000

WORKDIR /app

COPY --from=build-env /app .

ENV NODE_ENV production
# https://github.com/webpack/webpack/issues/14532#issuecomment-947012063
ENV NODE_OPTIONS=--openssl-legacy-provider

USER nonroot
EXPOSE 3000

CMD ["index.js"]

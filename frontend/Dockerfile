FROM node:24.19.0-alpine3.24 as build-env

WORKDIR /app

# Copy in whatever isn't filtered by .dockerignore
COPY . .

RUN npm ci && npm run build && npm prune --omit=dev

FROM node:24.19.0-alpine3.24

ENV HOST 0.0.0.0
ENV PORT 3000

WORKDIR /app

COPY --from=build-env /app .

ENV NODE_ENV production

USER 1000:1000
EXPOSE 3000

CMD ["index.js"]

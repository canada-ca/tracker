FROM golang:1.25.0-alpine3.22 AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/findings-processor ./cmd/service

FROM alpine:3.22

RUN addgroup -S app && adduser -S app -G app
USER app

WORKDIR /app
COPY --from=build /out/findings-processor /app/findings-processor

ENTRYPOINT ["/app/findings-processor"]

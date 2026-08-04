FROM golang:1.25-alpine AS builder

WORKDIR /src
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/subdomain-takeover ./cmd/service

# Runtime stage
FROM alpine:3.22

RUN addgroup -S scanner && adduser -S scanner -G scanner
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /out/subdomain-takeover /app/subdomain-takeover

USER scanner
ENTRYPOINT ["/app/subdomain-takeover"]

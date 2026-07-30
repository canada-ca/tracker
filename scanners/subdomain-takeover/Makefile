.PHONY: help run test test-race build fmt fmt-check vet lint tidy ci

GO ?= go
SERVICE_BIN ?= subdomain-takeover
BUILD_DIR ?= bin

help:
	@printf "Targets:\n"
	@printf "  make run        - Run the service\n"
	@printf "  make test       - Run all tests\n"
	@printf "  make test-race  - Run tests with race detector\n"
	@printf "  make build      - Build service binary\n"
	@printf "  make fmt        - Format Go files\n"
	@printf "  make fmt-check  - Check formatting (no changes)\n"
	@printf "  make vet        - Run go vet\n"
	@printf "  make lint       - Run fmt-check + vet\n"
	@printf "  make tidy       - Tidy modules\n"
	@printf "  make ci         - Lint, test, build\n"

run:
	$(GO) run ./cmd/service

test:
	$(GO) test ./...

test-race:
	$(GO) test -race ./...

build:
	mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 $(GO) build -o $(BUILD_DIR)/$(SERVICE_BIN) ./cmd/service

fmt:
	$(GO) fmt ./...

fmt-check:
	@test -z "$$($(GO)fmt -l .)" || (printf "Unformatted files found. Run 'make fmt'.\n" && exit 1)

vet:
	$(GO) vet ./...

lint: fmt-check vet

tidy:
	$(GO) mod tidy

ci: lint test build

# subdomain-takeover-service

Go microservice that consumes DNS scan results and emits normalized subdomain takeover findings.

## What it does

1. Consumes from `scans.dns_scanner_results` (JetStream stream: `SCANS`)
2. Evaluates passive CNAME and NS takeover risk using provider fingerprints
3. Assigns confidence (`suspected`, `probable`, `confirmed`)
4. Publishes findings to `scans.findings.upsert`

## Current detection scope

Implemented today:

- CNAME passive detection
- NS passive detection (vulnerable-only emission policy)
- Deterministic NS candidate selection when multiple providers/hosts match
- Nil-safe evidence extraction for CNAME and NS
- Classifier refactor to support injected fingerprint sources (`FingerprintSource`)

Current NS behavior:

- NS provider/host matches are evaluated and ranked
- Findings are emitted only for exploitable NS outcomes:
  - `NS_FULL_LAME_PROVIDER_VULNERABLE`
  - `NS_PARTIAL_LAME_PROVIDER_VULNERABLE`
- Non-exploitable NS matches (`NS_LAME_PROVIDER_UNKNOWN`, `NS_PROVIDER_MATCH_ONLY`) are classified but not emitted

## Passive-only detection policy

This service uses passive checks only.
It does not attempt account takeover, resource claiming, or any active validation.

As a result, confidence is conservative and evidence-driven:
- `suspected`: weak or incomplete takeover indicators
- `probable`: strong passive indicators with known exploitable conditions
- `confirmed`: reserved for deterministic passive signatures only

## Confidence model (current)

### CNAME

- `suspected`
  - provider target matched, but required passive signal is missing
- `probable`
  - dangling target with NXDOMAIN where required, or
  - provider fingerprint body match for providers that require body verification
- `confirmed`
  - reserved; not currently emitted by CNAME rules

### NS

- `confirmed`
  - full lame delegation + exploitable provider status
- `probable`
  - partial lame delegation + exploitable provider status
- `suspected`
  - reason codes exist for weaker NS states, but these are currently not emitted

## Internal package layout

Detection logic was split into focused files to reduce coupling:

- `internal/detect/cname_rules.go`
- `internal/detect/ns_rules.go`
- `internal/detect/ns_reasoning.go`
- `internal/detect/cname_evidence.go`
- `internal/detect/ns_evidence.go`
- `internal/detect/fingerprint_source.go`

`Classifier` now supports dependency injection via `NewClassifierWithSource(...)`, while `NewClassifier(...)` defaults to global loaded fingerprints.

## Fingerprint data

Provider fingerprint data is stored in:

- `internal/fingerprints/data/cname_fingerprints.json`
- `internal/fingerprints/data/ns_fingerprints.json`

The service embeds and validates these files at startup (`fingerprints.Load`).

For CNAME body matching:

- `mode: literal` performs plain substring search
- `mode: regex` performs regular expression matching
- if `mode` is omitted, the loader applies backward-compatible inference

## Prerequisites

- Go 1.25+
- NATS with JetStream enabled
- `nats` CLI (optional, for local testing)

## Quick start

```bash
go mod tidy
go run ./cmd/service
```

## Local commands

This service includes a local `Makefile` for common workflows:

```bash
make help      # list targets
make run       # run the service
make test      # run tests
make lint      # fmt-check + vet
make build     # build bin/subdomain-takeover
make ci        # lint + test + build
```

Environment variables:
- `NATS_URL` (default: `nats://localhost:4222`)
- `NATS_STREAM` (default: `SCANS`)
- `SUBJECT_IN` (default: `scans.dns_scanner_results`)
- `SUBJECT_OUT` (default: `scans.findings.upsert`)
- `DURABLE_NAME` (default: `subdomain_takeover`)
- `WORKER_COUNT` (default: `5`)
- `LOG_LEVEL` (default: `info`)

## Message ack behavior

The worker uses explicit JetStream ack semantics:

- decode failures -> `Term()` (drop poison message)
- classify/publish failures -> `Nak()` (retryable)
- successful processing -> `Ack()`

## Local test flow

Publish a test request:

```bash
nats pub scans.dns_scanner_results '{"domain_key":"12345","results":{"domain":"example.gc.ca","resolve_chain":[["old-app.example.gc.ca. 300 IN CNAME old-app.azurewebsites.net."]],"cname_record":"old-app.example.gc.ca. 300 IN CNAME old-app.azurewebsites.net.","ns_delegations":{"ns_hosts":["ns1.example-dns-provider.net"],"ns_checks":[],"ns_delegation":{"total_ns":1,"authoritative_ok":0,"lame_count":1,"lame_type":"full"},"error":""}}}'
```

Watch findings:

```bash
nats sub "scans.findings.upsert"
```

## Next steps / nice-to-haves

1. Add table-driven tests for NS reason mapping, ranking, and emission gating.
2. Add classifier integration tests using injected `FingerprintSource`.
3. Document and implement explicit policy for `edge_case` and `registration_closed` NS provider statuses.
4. Add structured debug logs for NS matching decisions (host, provider, status, reason).
5. Add registrar-context mismatch handling (`RegistrarMismatch`) and confidence policy.
6. Add metrics (counts by reason code, emitted vs suppressed) for production observability.

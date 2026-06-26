# subdomain-takeover-service

Go microservice that consumes DNS scan results and emits normalized subdomain takeover findings.

## What it does

1. Consumes from `scans.dns_scanner_results` (JetStream stream: `SCANS`)
2. Evaluates takeover risk using passive DNS evidence + provider fingerprints
3. Assigns confidence (`suspected`, `probable`, `confirmed`)
4. Publishes findings to `scans.findings.upsert`

## Passive-only detection policy

This service uses passive checks only.
It does not attempt account takeover, resource claiming, or any active validation.

As a result, confidence is conservative and evidence-driven:
- `suspected`: weak or incomplete takeover indicators
- `probable`: strong passive indicators with known exploitable conditions
- `confirmed`: reserved for deterministic passive signatures only

## Sitting Duck DNS hijack coverage

The scanner includes passive detection for Sitting Duck style DNS hijack risk.

A Sitting Duck takeover is considered possible when all of the following are true:

1. The registered domain uses or delegates authoritative DNS services to a provider other than the registrar.
2. The authoritative name server cannot resolve authoritatively for the domain (lame delegation).
3. The DNS provider is known to allow domain/zone claiming without strong ownership verification.

### Variations covered

- Partially lame delegation: some NS records are lame, others still answer.
- Full lame delegation: all authoritative NS are lame.
- Redelegation drift: domain appears redelegated while stale or invalid NS remains and creates takeover exposure.

If lame delegation and exploitable provider conditions are both present, the domain is considered hijackable risk.

## Confidence model

This model applies across both CNAME-based takeover checks and NS-based Sitting Duck checks.

- `suspected`
  - dangling/suspicious DNS pattern only, or
  - lame delegation evidence without known exploitable-provider confirmation
- `probable`
  - DNS pattern + known provider unclaimed signature, or
  - lame delegation confirmed (`partial` or `full`) + exploitable-provider rule match
- `confirmed`
  - explicit passive takeover indicator with deterministic evidence
  - if deterministic passive proof is missing, cap at `probable`

## Required evidence for findings

Each finding should include:
- `domain`
- `domain_key`
- `record_type` (`CNAME` or `NS`)
- `target` or `ns_host`
- `provider`
- `lame_type` (`partial` or `full`) for Sitting Duck findings
- per-NS resolver outcomes where applicable
- `confidence`
- `reason_code`
- remediation guidance

## Remediation guidance

Typical remediation:
1. Fix delegation at registrar and authoritative DNS provider.
2. Remove stale or dead NS entries.
3. Reclaim or securely rebind abandoned DNS zones or accounts.
4. Validate ownership controls for DNS provider account workflows.

## Prerequisites

- Go 1.24+
- NATS with JetStream enabled
- `nats` CLI (optional, for local testing)

## Quick start

```bash
go mod tidy
go run ./cmd/service
```

Environment variables:
- `NATS_URL` (default: `nats://localhost:4222`)
- `NATS_STREAM` (default: `SCANS`)
- `SUBJECT_IN` (default: `scans.dns_scanner_results`)
- `SUBJECT_OUT` (default: `scans.findings.upsert`)
- `DURABLE_NAME` (default: `subdomain_takeover`)
- `WORKER_COUNT` (default: `5`)
- `LOG_LEVEL` (default: `info`)

Local test flow:

Publish a test request:
```bash
nats pub scans.dns_scanner_results '{"domain":"example.gc.ca","domain_key":"12345","shared_id":null,"results":{"record_exists":true,"rcode":"NOERROR","resolve_chain":[["old-app.example.gc.ca. 300 IN CNAME old-app.azurewebsites.net."]],"cname_record":"old-app.example.gc.ca. 300 IN CNAME old-app.azurewebsites.net.","ns_records":{"hostnames":["ns1.example-dns-provider.net"],"warnings":[]}}}'
```

Watch findings:
```bash
nats sub "scans.findings.upsert"
```

## Development milestones

1. Build config + NATS consume/publish loop.
2. Add DNS evidence extraction.
3. Add provider fingerprint rule engine.
4. Add confidence scoring and remediation text.
5. Add tests for classification rules and message handling.

---

## External Go modules to install

Start minimal:

```bash
go get github.com/nats-io/nats.go
go get github.com/miekg/dns
go get github.com/rs/zerolog
go get golang.org/x/sync/errgroup
go get github.com/stretchr/testify
```

What each is for:
- `nats.go`: JetStream consume/publish
- `miekg/dns`: robust DNS lookups and record parsing
- `zerolog`: structured logs without heavy setup
- `errgroup`: clean goroutine lifecycle management
- `testify`: easier assertions in unit tests

# subdomain-takeover-service

Go microservice that consumes DNS scan results and emits normalized subdomain takeover findings.

## What it does

1. Consumes from `scans.dns_scanner_results` (JetStream stream: `SCANS`)
2. Evaluates passive CNAME takeover risk using provider fingerprints
3. Assigns confidence (`suspected`, `probable`, `confirmed`)
4. Publishes findings to `scans.findings.upsert`

## Current detection scope

- Implemented: CNAME-based passive detection
- Not implemented yet: NS-based (Sitting Duck) detection

The service currently focuses on passive CNAME classification only. NS-related types and reason codes exist in the codebase for upcoming work, but NS findings are not emitted yet.

## Passive-only detection policy

This service uses passive checks only.
It does not attempt account takeover, resource claiming, or any active validation.

As a result, confidence is conservative and evidence-driven:
- `suspected`: weak or incomplete takeover indicators
- `probable`: strong passive indicators with known exploitable conditions
- `confirmed`: reserved for deterministic passive signatures only

## Confidence model (current)

Current production behavior for CNAME findings:

- `suspected`
  - provider target matched, but required passive signal is missing
- `probable`
  - dangling target with NXDOMAIN where required, or
  - provider fingerprint body match for providers that require body verification
- `confirmed`
  - reserved; not currently emitted by CNAME rules

## Fingerprint data

Provider fingerprint data is stored in:

- `internal/detect/data/cname_fingerprints.json`
- `internal/detect/data/ns_fingerprints.json`

The service embeds and validates these files at startup (`detect.LoadFingerprints`).

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
nats pub scans.dns_scanner_results '{"domain":"example.gc.ca","domain_key":"12345","base_domain":"example.gc.ca","zone_apex":"example.gc.ca","record_exists":true,"rcode":"NOERROR","resolve_chain":[["old-app.example.gc.ca. 300 IN CNAME old-app.azurewebsites.net."]],"cname_record":"old-app.example.gc.ca. 300 IN CNAME old-app.azurewebsites.net.","ns_records":{"hostnames":["ns1.example-dns-provider.net"],"warnings":[]}}'
```

Watch findings:

```bash
nats sub "scans.findings.upsert"
```

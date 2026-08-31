# Findings Processor

Consumes finding events from NATS JetStream and upserts normalized finding documents into ArangoDB `additionalFindings`.

## What it does

- Subscribes to `scans.findings.*` (configurable)
- Validates incoming payloads
- Writes findings to ArangoDB
- Acknowledges messages with explicit `Ack` / `Nak` / `Term` behavior

## Event contract (current)

Expected JSON fields:

- Required: `source`, `findingType`, `domainKey`, `subject`, `confidence`, `observedAt`
- Optional: `severity`, `reasonCode`, `evidence`, `attributes`

`observedAt` must be RFC3339.

## Local development

1. Copy env template:

```bash
cp .env.example .env
```

2. Fill required vars in `.env` (at minimum DB and NATS settings).

3. Run service:

```bash
go run ./cmd/service
```

## Environment variables

| Variable                | Default                 | Notes                           |
| ----------------------- | ----------------------- | ------------------------------- |
| `NATS_URL`              | `nats://localhost:4222` | NATS server URL                 |
| `NATS_STREAM`           | `SCANS`                 | JetStream stream name           |
| `NATS_SUBJECT`          | `scans.findings.*`      | Subscription subject            |
| `NATS_CONSUMER_DURABLE` | `findings-processor`    | Durable consumer name           |
| `NATS_QUEUE_GROUP`      | _(empty)_               | Leave empty for single instance |
| `NATS_ACK_WAIT`         | `30s`                   | Ack timeout                     |
| `NATS_MAX_DELIVER`      | `10`                    | Max redeliveries                |
| `NATS_MAX_ACK_PENDING`  | `256`                   | Max pending unacked messages    |
| `DB_URL`                | `http://localhost:8529` | ArangoDB URL                    |
| `DB_USER`               | _(none)_                | ArangoDB user                   |
| `DB_NAME`               | _(none)_                | ArangoDB database               |
| `DB_PASS`               | _(empty)_               | ArangoDB password               |
| `LOG_LEVEL`             | `info`                  | Zerolog global level            |
| `LOG_PRETTY`            | `true`                  | Human-readable logs             |

## Subscription mode

- Single instance: keep `NATS_QUEUE_GROUP` empty
- Multiple replicas: set `NATS_QUEUE_GROUP` to a shared value and ensure consumer config supports queue delivery

## Docker

Build:

```bash
docker build -t findings-processor .
```

Run:

```bash
docker run --rm --env-file .env findings-processor
```

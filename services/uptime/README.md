# Uptime Service

This service generates a Gatus configuration from ArangoDB data and serves uptime monitoring at `uptime.tracker.canada.ca`.

## What It Does

- Queries ArangoDB for domains with `highAvailability == true`
- Builds a Gatus `config.yaml` with endpoint checks and alerting
- Runs Gatus with the generated configuration

## Files

- `sync-gatus-config.py`: Fetches domains and writes Gatus config
- `Dockerfile`: Image for the sync/init process
- `docker-compose.local.yaml`: Local test stack (init sync + Gatus)
- `.env.example`: Environment variable template

## Environment Variables

Copy `.env.example` to `.env` and fill values:

- `ARANGO_URL`
- `ARANGO_DATABASE`
- `ARANGO_USERNAME`
- `ARANGO_PASSWORD`
- `NOTIFICATION_API_KEY`
- `NOTIFICATION_API_URL`
- `SERVICE_ACCOUNT_EMAIL`
- `NOTIFICATION_UPTIME_ALERT_ID`

Notes:

- `GATUS_CONFIG_PATH` is set by Compose to `/config/config.yaml`.
- Do not use `localhost` for `ARANGO_URL` in `.env` when running Compose. Inside `sync-init`, `localhost` points to the container itself.
- For a DB running on your host machine, use `ARANGO_URL=http://host.docker.internal:8529`.
- If ArangoDB is another Compose service, use its service name (for example `ARANGO_URL=http://arangodb:8529`).

## Run Locally (Docker Compose)

From this directory (`services/uptime`):

```bash
docker compose -f docker-compose.local.yaml up --build
```

Open:

- `http://localhost:8080/uptime`

## How Local Compose Mirrors Kubernetes

The `sync-init` service emulates the Kubernetes init container:

1. Runs `python /app/sync-gatus-config.py`

Then `gatus` starts only after `sync-init` completes successfully and mounts:

- `/config` (generated config)

## Useful Commands

Render merged compose config:

```bash
docker compose -f docker-compose.local.yaml config
```

Start in background:

```bash
docker compose -f docker-compose.local.yaml up --build -d
```

Stop and remove containers:

```bash
docker compose -f docker-compose.local.yaml down
```

Remove containers and volumes (fresh state):

```bash
docker compose -f docker-compose.local.yaml down -v
```

## Troubleshooting

- If `sync-init` exits immediately, inspect logs:

```bash
docker compose -f docker-compose.local.yaml logs sync-init
```

- If Gatus starts but shows no endpoints, check ArangoDB connectivity and credentials in `.env`.

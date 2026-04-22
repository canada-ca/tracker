# Gatus Uptime Dashboard

Gatus pod serving a live uptime dashboard at `/uptime`. Monitors domains with `highAvailability == true` in ArangoDB. No Prometheus, no history — live status only.

## Before deploying

Populate the `uptime` Secret in the `uptime` namespace with real credentials:

```sh
kubectl create secret generic uptime \
  --namespace uptime \
  --from-literal=ARANGO_URL='http://arangodb.db.svc.cluster.local:8529' \
  --from-literal=ARANGO_DATABASE='<db name>' \
  --from-literal=ARANGO_USERNAME='<username>' \
  --from-literal=ARANGO_PASSWORD='<password>'
```

## Smoke test

1. Check init container completed successfully:
   ```sh
   kubectl logs -n uptime deploy/tracker-uptime -c sync-init
   # Expect: "Query returned N document(s)" and "Config written successfully"
   ```

2. Check Gatus started and loaded config:
   ```sh
   kubectl logs -n uptime deploy/tracker-uptime -c gatus
   # Expect: "Reloading configuration" or "Listening on :8080"
   ```

3. Open `/uptime` in the browser — Gatus dashboard should load and show services.

4. Verify asset URLs on the `/uptime` page include `/uptime` in their path (no broken relative links). Check browser DevTools network tab for 404s.

5. Trigger a manual sync and watch for reload:
   ```sh
   kubectl exec -n uptime deploy/tracker-uptime -c sync-sidecar -- python /app/sync-gatus-config.py
   kubectl logs -n uptime deploy/tracker-uptime -c gatus --follow
   # Expect: "Reloading configuration" within a few seconds
   ```

## Architecture

| Container | Image | Role |
|---|---|---|
| `sync-init` | `uptime-sync` | Runs once before Gatus starts; writes initial `/config/config.yaml` |
| `gatus` | `ghcr.io/twin/gatus:v5.12.0` | Serves dashboard on port 8080; reloads config on SIGHUP |
| `sync-sidecar` | `uptime-sync` | Re-runs sync every `SYNC_INTERVAL_SECONDS` (default: 300s); sends SIGHUP to Gatus |

`shareProcessNamespace: true` is required on the pod so the sidecar can find and signal the Gatus process via `/proc`.

## Future work

The following are explicitly out of scope for this MVP and would require deliberate design decisions before implementation:

- **Prometheus metrics** — expose `/metrics` and scrape with Prometheus; requires adding a ServiceMonitor and deciding on retention policy
- **Grafana dashboards** — visualize uptime trends; depends on Prometheus integration above
- **SLA reporting** — uptime percentage, incident history, availability reports; requires persistent storage (replace `storage.type: memory` with PostgreSQL or SQLite with a PVC)
- **Alert notification channels** — Slack, PagerDuty, email, etc.; the `alerts` block is scaffolded in each endpoint but the `alerting:` provider section is intentionally omitted from the config; Gatus logs alerts locally only
- **TLS at the pod level** — currently handled by the Istio ingress; adding pod-level TLS would require cert injection
- **Horizontal pod autoscaling / multiple replicas** — Gatus uses in-memory state; multiple replicas would show inconsistent dashboards without shared storage
- **External Gatus history database** — replace memory storage with a persistent backend to retain check history across pod restarts
- **Authentication** — the Gatus dashboard is currently unauthenticated. Tracker issues a `refresh_token` `HttpOnly` cookie (HS256, signed with `REFRESH_KEY`) on login via `authenticate.js`. An nginx auth proxy sidecar could intercept requests to `/uptime`, call the `refreshTokens` GraphQL mutation using that cookie, and only proxy to Gatus on a valid response. Istio `RequestAuthentication` is not viable as it requires RS256/asymmetric JWKS and Tracker uses a symmetric secret.

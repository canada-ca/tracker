# CVD Enrollment Service

This service keeps HackerOne assets in line with the CVD (Coordinated Vulnerability Disclosure) enrollment status of domains stored in ArangoDB. Each run is a single sync pass: it reads domains from ArangoDB, reads assets from HackerOne, and creates, rescopes, or archives assets to remove the differences. It then emails a list of newly enrolled domains through GC Notify.

## How a sync pass works

1. Fetch all active domains from ArangoDB. Archived domains and domains with `rcode` `NXDOMAIN` are skipped. Domains are split by `cvdEnrollment.status` into `enrolled` and `deny`.
2. Fetch in-scope and out-of-scope domain assets from HackerOne.
3. Compare the two sets (`sync.compute_changes`, a pure function) and apply the result:
   1. Create new enrolled assets.
   2. Rescope out-of-scope assets that are now enrolled.
   3. Create new denied assets.
   4. Rescope in-scope assets that are now denied.
   5. Archive the assets that are no longer enrolled or denied.
4. Email the new and rescoped enrolled domains to `SERVICE_ACCOUNT_EMAIL`. No email is sent when the list is empty.

If domains cannot be read from ArangoDB, or the in-scope assets cannot be read from HackerOne, the run logs an error and stops without changes.

### Decision table

| Situation in ArangoDB and HackerOne | Action |
| --- | --- |
| Domain is `enrolled` and has no HackerOne asset | Create the asset with scope eligible for submission. The asset gets the GC Org ID tag that matches the domain owner's `externalId`. The domain is included in the notification. |
| Domain is `deny` and has no HackerOne asset | Create the asset with scope not eligible for submission. |
| Domain is `enrolled` and its asset is out of scope (deny to enrolled) | Update the existing scope to eligible for submission. The domain is included in the notification. |
| Domain is `deny` and its asset is in scope (enrolled to deny) | Update the existing scope to not eligible for submission. |
| Asset is in scope, its domain exists in ArangoDB, and the domain is neither `enrolled` nor `deny` | Archive the asset. |
| Asset is in scope and its domain is not in ArangoDB (or is archived or `NXDOMAIN`) | No action. |
| Fetching out-of-scope assets fails | The run continues in degraded mode. Out-of-scope assets are treated as unknown, so deny to enrolled rescoping is skipped. Domains whose assets are out of scope also count as having no asset, so the run attempts to create them. |
| Domain was archived earlier in HackerOne | Not re-added. The HackerOne API does not support re-adding archived assets. |

A new asset is created in two calls: the asset first, then its scope. A domain with no owner, or with an owner that has no matching tag, counts as a failed creation and is skipped. Failures for one domain do not stop the run for other domains. Creation requests (POST) are never retried. GET and PUT requests are retried up to 3 times on HTTP 429, 500, 502, 503, and 504.

## File layout

| File | Purpose |
| --- | --- |
| `main.py` | Entrypoint. Under `__main__` it loads `.env`, builds `Config`, configures logging, connects to ArangoDB, and runs `main()` once. |
| `config.py` | Frozen `Config` with nested `HackerOneSettings` and `NotifySettings`, built by `Config.from_env()`. Raises `ConfigError` for an invalid `LOGGER_LEVEL`. |
| `logging_setup.py` | Sends DEBUG and INFO logs to stdout, and WARNING and above to stderr. |
| `db.py` | ArangoDB queries: `fetch_domains` and `fetch_domain_owners` (one batched query). |
| `tags.py` | Fetches HackerOne asset tags in the "GC Org ID" category, up to 10 pages of 100. |
| `sync.py` | `compute_changes` and `Changes` (pure diff), plus the functions that apply changes: `create_assets`, `rescope_assets`, `archive`. |
| `hackerone.py` | HackerOne API client. Every function takes a `HackerOneSettings` argument. |
| `notify.py` | `NotifySettings` and `send_enrollment_notification`. The GC Notify client is built for each call. |
| `tests/` | Unit tests and integration tests. |
| `Dockerfile`, `cloudbuild.yaml` | Container build and CI. |

## Environment variables

`Config.from_env()` reads all variables once. Unset values are `None`, except `LOGGER_LEVEL` and `H1_BASE_URL`, which have defaults. The service does not check the other variables at startup, so a missing value shows up later as a failed API call or a logged error.

| Variable | Used for | Default |
| --- | --- | --- |
| `LOGGER_LEVEL` | Log level name, such as `DEBUG` or `INFO`. An unknown name stops startup. | `INFO` |
| `DB_URL` | ArangoDB host URL | none |
| `DB_NAME` | ArangoDB database name | none |
| `DB_USER` | ArangoDB user | none |
| `DB_PASS` | ArangoDB password | none |
| `API_USERNAME` | HackerOne API username (basic auth) | none |
| `API_TOKEN` | HackerOne API token (basic auth) | none |
| `ORG_ID` | HackerOne organization ID | none |
| `PROGRAM_ID` | HackerOne program ID linked to each asset scope | none |
| `H1_BASE_URL` | HackerOne API base URL. An empty value uses the default. | `https://api.hackerone.com/v1` |
| `NOTIFICATION_API_KEY` | GC Notify API key | none |
| `NOTIFICATION_API_URL` | GC Notify base URL | none |
| `CVD_ENROLLMENT_NOTIFICATION_TEMPLATE_ID` | GC Notify email template ID | none |
| `SERVICE_ACCOUNT_EMAIL` | Recipient of the enrollment notification | none |

`.env.example` lists these variables without values.

## Run locally

Create a virtual environment, install `requirements.txt`, and copy `.env.example` to `.env`. Fill in the values. Then run:

```bash
python main.py
```

`main.py` loads `.env` only when run directly. When another module imports `main`, no `.env` file is read.

## Tests

Tests use no mocks. They run against in-process fake HackerOne and GC Notify HTTP servers (see `tests/conftest.py`).

Run the unit tests. `pytest.ini` deselects tests marked `integration` by default:

```bash
python -m pytest tests -v
```

The integration tests (`tests/test_db.py` and `tests/test_main_integration.py`) need a real ArangoDB. Start ArangoDB 3.12.1 with Docker:

```bash
docker run -d --name cvd-test-arangodb -p 8529:8529 -e ARANGO_ROOT_PASSWORD=test arangodb/arangodb:3.12.1
```

Set the connection variables and select the `integration` marker:

```bash
export TEST_ARANGO_URL=http://localhost:8529
export TEST_ARANGO_USER=root
export TEST_ARANGO_PASS=test
python -m pytest tests -v -m integration
```

Each test creates and drops a throwaway database. Remove the container when you finish: `docker rm -f cvd-test-arangodb`.

## CI (Cloud Build)

`cloudbuild.yaml` runs these steps in order:

1. `start-arango`: start an `arangodb/arangodb:3.12.1` container and wait up to 120 seconds for it to be ready.
2. `generate-image-name`: build the image name from the branch name, short SHA, and a timestamp.
3. `build-test-image`: build the Dockerfile `test` target.
4. `run-tests`: run the unit tests in the test image.
5. `run-integration-tests`: run the integration tests against the ArangoDB container.
6. `build-production-image`: build the default Dockerfile target.
7. `push-enrollment-if-master`: push the image only when the branch is `master`.

The `_TEST_DB_PASS` substitution is a throwaway password for the build-local test database.

## Docker

The Dockerfile has these stages: `base`, `python-builder` (installs `requirements.txt`), `production` (copies the top-level `*.py` files, runs as a non-root user, and starts `python3 main.py`), `test` (adds the `tests/` directory and the rest of the context), and `final` (the default target, same as `production`).

```bash
docker build -t cvd-enrollment .
docker run --rm --env-file .env cvd-enrollment
```

`.dockerignore` excludes `.env` files, so pass the variables at run time as shown.

## Requirements

- Python 3.11 or later. `config.py` uses `logging.getLevelNamesMapping`, which was added in 3.11. The Dockerfile uses Python 3.14.2.
- Packages are pinned in `requirements.txt`.

## Notes

- Archived assets are not re-added. The HackerOne API does not support re-adding them.

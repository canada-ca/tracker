# Dev seed

Fills a local Tracker database with users, organizations, domains, scan results and summaries, so the frontend and API have something to show without running the scanners. It is for development only. Never point it at a shared or production database.

## What it runs

A single run does everything, in this order:

1. **Schema** (`schema.js`). Connects to `_system` as `root`, creates `DB_NAME` with `DB_USER`/`DB_PASS` if it is missing, then runs arango-tools `ensure` against `database-migration/database.json`. This is the same thing `database-migration/` does; the schema file is read from there, not copied.
2. **Guidance** (`guidance.js`). Loads `guidanceTags`, `scanSummaryCriteria` and `chartSummaryCriteria` from `services/guidance/guidance.json`, the same way `services/guidance/guidance.py` does. Scan docs only store tag ids such as `dmarc23`; this is what lets the API resolve them.
3. **Seed** (users, orgs, domains, scans, summaries).

You don't need to run `database-migration/` or `services/guidance/` separately.

## Environment

| Variable    | Purpose                                                                                                   | Default                 | Source of default                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| `DB_URL`    | ArangoDB URL                                                                                              | `http://localhost:8529` | `.devcontainer/api/devcontainer.json`, `api/README.md`                            |
| `DB_NAME`   | Database name (the same one the API uses)                                                                 | `track_dmarc`           | `.devcontainer/api/devcontainer.json`, `api/README.md`                            |
| `DB_USER`   | Database user                                                                                             | `root`                  | `api/index.js` (the API always connects as `root`)                                |
| `DB_PASS`   | Database password                                                                                         | `test`                  | `.devcontainer/api/devcontainer.json`, `api/README.md`                            |
| `ROOT_PASS` | ArangoDB `root` password. Used to create the database and user, and by arango-tools to ensure the schema. | `test`                  | `ARANGO_ROOT_PASSWORD` in `api/docker-compose.yaml`; the API uses it as `DB_PASS` |

Each variable falls back to its default when unset, so a standard local setup (the API devcontainer, or `api/docker-compose.yaml`'s Arango) needs no env vars. Set any of them to override. At startup the script prints `DB_URL`, `DB_NAME` and `DB_USER` and marks which came from defaults. Passwords are never printed.

The API has no separate database user: it logs in as `root` with `DB_PASS`. That's why `DB_USER` defaults to `root` and `DB_PASS` and `ROOT_PASS` share a default. If you run Arango with a dedicated user, set `DB_USER`/`DB_PASS` explicitly.

## Usage

```sh
npm install
node index.js --email you@example.com [--password <password>] [--reset] [--force]

# Overriding defaults:
DB_URL=http://localhost:18529 DB_NAME=my_db node index.js --email you@example.com
```

- `--email` (required) is the super admin login.
- `--password` sets the super admin password. If you leave it out, the script prompts for it with hidden input. A terminal is required in that case.
- `--reset` asks for confirmation, then truncates **only** the collections this script writes to: users, organizations, affiliations, domains, claims, ownership, dns, web, webScan, domainsDNS, domainsWeb, webToWebScans, selectors, domainsToSelectors, dmarcSummaries, domainsToDmarcSummaries, chartSummaries and organizationSummaries. This also removes any accounts you created by hand. The guidance collections are not truncated; they are reloaded from source on every run anyway.
- `--force` skips the safety check described below. Without it the script exits (non-zero) before writing anything if the database already holds data it didn't write.

### Safety check and the `devSeed` marker

Every document and edge the script writes to the collections listed above gets a `devSeed: true` field. Before loading guidance, resetting or seeding, the script checks each of those collections for any document without that marker. If it finds one, it lists the affected collections and exits, because seeding could overwrite real scans that share the fixed seed scan keys, replace today's chart summaries, reset the password and disable 2FA of an existing account using the super admin email, and (with `--reset`) truncate whole collections. Pass `--force` to proceed anyway; a warning is printed instead.

Notes:

- The schema step runs before the check. It only creates missing collections/indexes, so it's harmless on a populated database.
- The check runs before `--reset`, so `--reset` on a database with unmarked data also needs `--force`.
- Guidance collections are not marked or checked; they're reloaded from source on every run.

You can run the script repeatedly. Records are upserted by these keys:

| Records                     | Matched on              |
| --------------------------- | ----------------------- |
| Users                       | `userName`              |
| Orgs                        | `orgDetails.en.slug`    |
| Domains                     | `domain`                |
| Edges                       | `_from` + `_to`         |
| DMARC summary edges         | `_from` + `startDate`   |
| Scan and DMARC summary docs | fixed numeric `_key`s   |
| Chart summaries             | `date` + `scope`        |
| Org summaries               | `organization` + `date` |

On each run, scan timestamps are regenerated relative to the current time. They use the scanners' format, `YYYY-MM-DD HH:MM:SS.ffffff+00:00` (UTC; the microseconds always end in `000`).

Guidance documents are upserted by `_key`.

When it finishes, the script prints a table of logins and a matrix of domains and scans.

## Fixtures

### Organizations

| Org              | Slug               | Verified | Purpose                                                              |
| ---------------- | ------------------ | -------- | -------------------------------------------------------------------- |
| Super Admin (SA) | `super-admin`      | no       | Holds the `super_admin` affiliation; the API hides it from org lists |
| Verified Org A   | `verified-org-a`   | yes      | Main org: most domains, ownership and DMARC summary                  |
| Verified Org B   | `verified-org-b`   | yes      | Second verified org, for implicit cross-org access                   |
| Unverified Org C | `unverified-org-c` | no       | Unverified org path; shares a domain with A                          |

### Users

Every fixture user has the password `dev-password-1` and `tfaSendMethod: 'none'`.

| Email                          | Affiliations        | Demonstrates                                                              |
| ------------------------------ | ------------------- | ------------------------------------------------------------------------- |
| `--email` you pass             | super_admin @ SA    | Super admin view; admin-only domain fields                                |
| `owner@example.com`            | owner @ A           | Owner permissions; DMARC summary on the owned domain                      |
| `admin@example.com`            | admin @ A           | Managing domains and affiliations                                         |
| `user@example.com`             | user @ A            | Read-only member; implicit `user` access to verified Org B                |
| `pending@example.com`          | pending @ A         | Pending request; no implicit access to verified orgs                      |
| `unverified-user@example.com`  | user @ C            | Belongs only to an unverified org, so has no implicit verified-org access |
| `unverified-email@example.com` | user @ A            | `emailValidated: false`, so mutations are blocked by `verifiedRequired`   |
| `orphan@example.com`           | none                | Empty states and the join-request flow                                    |
| `multi@example.com`            | admin @ A, user @ B | Permissions that differ per org                                           |

### Domains

| Domain              | Claims                   | Scans (older → latest) | Notes                                                          |
| ------------------- | ------------------------ | ---------------------- | -------------------------------------------------------------- |
| `all-pass.test`     | A: approved              | mixed → pass           | Owned by A; DMARC summary (`thirtyDays`); selector `selector1` |
| `all-fail.test`     | A: approved              | fail → fail            |                                                                |
| `mixed.test`        | B: approved              | fail → mixed           |                                                                |
| `shared.test`       | A: approved, C: approved | pass → pass            | Claimed by two orgs                                            |
| `unscanned.test`    | A: approved              | none                   | All statuses `info`, `lastRan: null`                           |
| `archived.test`     | A: approved              | none                   | `archived: true`; excluded from summaries                      |
| `nxdomain.test`     | B: approved              | none                   | `rcode: NXDOMAIN`; excluded from summaries                     |
| `monitor-only.test` | B: monitor-only          | none                   |                                                                |
| `candidate.test`    | A: candidate             | none                   |                                                                |
| `dependency.test`   | C: dependency            | none                   |                                                                |

The scan profiles are defined in `scans.js`. Their shapes follow what `scanners/dns-processor` and `scanners/web-processor` store, and they use real tag ids from those scanners. The fields each domain gets from its latest scan (`status.*`, `rcode`, `phase`, `negativeTags`, `latestDnsScan` and `latestWebScan`, among others) are set the same way the processors set them.

`chartSummaries` (scopes `all` and `verified`) and `organizationSummaries` are computed from the seeded domain statuses. The logic is ported from `services/summaries/summaries.py` and lives in `summaries.js`.

## Caveats

- **`services/super-admin` conflict.** That service finds the super admin org by acronym `SA` and the super admin edge by `defaultSA: true`. If you run it against a seeded database with a different `SA_USER_USERNAME`, it can create a new account, then delete and replace the seeded `defaultSA` affiliation. Use one or the other, or run it with the same username.
- **DKIM selector tags are null.** The API resolves DKIM selector tags from `dkimGuidanceTags`, but nothing populates that collection, including `services/guidance`. Selector-level tags therefore show as null. This is a known gap and is not caused by the seed.
- **`lastRan` stays `null`.** No scanner writes `lastRan`, so the seed leaves it as `null` too.
- **No automated tests.** The script is dev-only and needs a live ArangoDB.

## Next Steps

Running the API and frontend against the seeded database:

1. **Services.** ArangoDB is already running and seeded. The API also connects to NATS on startup, so start it before the API. `api/docker-compose.yaml` defines `nats` and `nats-box`; `nats-box` creates the `SCANS` stream. Redis is only needed for the API test suite, not for running the API.
2. **API** (`api/`):
   - `npm ci`
   - Copy [`api/.env.example`](../../api/.env.example) to `api/.env` and fill it in. The API loads it with `dotenv-safe`, so every key in `.env.example` must have a value. The ones that matter here:
     - `DB_URL`, `DB_NAME` and `DB_PASS` must match what you seeded with (defaults `http://localhost:8529`, `track_dmarc`, `test`). The API always connects as `root`.
     - `NATS_URL` should be `nats://localhost:4222` for local NATS (the value the API devcontainer uses).
     - `HASHING_SALT`: the API hashes domains as `md5(domain + HASHING_SALT)`, but the seed stores plain `md5(domain)`. Seeded domain hashes won't match the hashes the API computes, which affects only API-side hash lookups.
   - `npm run dev`. The GraphQL endpoint is `http://localhost:4000/graphql` (`PORT` defaults to `4000`).
3. **Frontend** (`frontend/`):
   - `npm ci --no-optional`
   - `npm run dev` starts the webpack dev server on port `3300`. The dev server has no proxy, and in development the client calls the relative path `/graphql`.
   - Start envoy with `docker compose up -d` in `frontend/`. It listens on `3000`, sends `/graphql` and `/editor` to the API on `4000` and everything else to the frontend on `3300`.
   - Open `http://localhost:3000`.
4. **Log in** with the `--email`/`--password` you gave the seed (super admin), or with any fixture user and the password `dev-password-1`. 2FA is disabled for all of these accounts (`tfaSendMethod: 'none'`).
5. **Scanners.** Scanner code is in [`scanners/`](../../scanners). `scanners/domain-dispatcher` reads domains from the database, skips archived ones and publishes them to NATS (`NATS_URL`). `unscanned.test` has no scan data, so it is the cleanest target for an end-to-end scan.

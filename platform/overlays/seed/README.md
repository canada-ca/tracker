# Seed

This overlay seeds the cluster with the initial namespaces and secrets needed
by the other overlays.

The way this currently works is leveraging [kustomize](https://kustomize.io/) and its [secret generator](https://github.com/kubernetes-sigs/kustomize/blob/master/examples/secretGeneratorPlugin.md) to generate kubernetes config from the .env and namespace files in this directory.

The namespaces are created primarily because they are needed to put the secrets in, but also because we can add the [labels needed to enable Istios automatic sidecar injection](https://istio.io/docs/setup/additional-setup/sidecar-injection/#automatic-sidecar-injection) feature.
There are a few files that will need to be created in this folder for everything to work.

```sh
api.env
kiali.env
postgres.env
scanners.env
```

## scanners.env

These are the JWT credentials needed for the various scanners to talk to each other, as well as the database credentials needed for the `results` service to put scan results into the database.

```sh
DB_USER=
DB_PASS=
DB_NAME=
TOKEN_KEY=
```

## pgo-cluster.env

In order to ensure data redundancy and other highly-available concepts, we are employing a [Postgres Operator](https://github.com/zalando/postgres-operator) to mange our PostgreSQL cluster.

By default, the PostgreSQL user for this deployment is `trackdmarc`, which is set in the `postgresql-deployment.yaml` config in the platform bases folder.  The values we set in `pgo-cluster.env` should be done keeping this in mind, and these values also have implications for the `DB_USER` and `DB_NAME` values in `api.env` and `scanners.env`.

```sh
username=trackdmarc
password=
```

## kiali.env

[Kiali](https://kiali.io/) is an observabiltiy tool for the Istio service mesh. It is not exposed externally, and currently only accessible via `istioctl dashboard kiali` for debugging purposes. Running this command will tunnel into the cluster, connect to Kiali and open it's admin dashboard. The credentials for that dashboard are what is being specified in `kiali.env`:

```sh
username=
passphrase=
```

## api.env

This file should contain the following values and generates a secret called `api` which is placed in the `api` namespace. Unsurprisingly it is used to set the env vars for the API deployment.

```sh
DB_USER=track_dmarc
DB_PASS=
DB_HOST=postgres
DB_PORT=5432
DB_NAME=track_dmarc
BASE32_SECRET=
SUPER_SECRET_KEY=
SUPER_SECRET_SALT=
NOTIFICATION_API_KEY=
NOTIFICATION_API_URL=
SA_USER_NAME=
SA_PASSWORD=
SA_DISPLAY_NAME=
TOKEN_KEY=
```

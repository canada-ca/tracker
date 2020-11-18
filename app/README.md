# App manifest files

Trackers deployment configuration is split into app and platform sections. This folder contains the app manifests: The base deployment and Service objects along with the apps use of whatever CRDs are supplied by the platform.

Environment specific variations can be found in the subfolders of the overlays directory.
To generate these manifests you need to install [kustomize](https://kustomize.io/). 

Before applying these please check out the README.md in each overlay to understand the individual configurations.

## Getting started

In accordance with the [12Factor app](https://12factor.net) philosophy, all the services [draws their config from the environment](https://12factor.net/config). 
To generate the config needed to run a copy of the app, we need to define some `.env` files, that will be used to create Kubernetes secrets, whose values are available to the various parts of the app.

First, the secret for the result-queue to insert scan results into to the database.

```
cat <<'EOF' > app/minikube/scanners.env
DB_PASS=test
DB_HOST=arangodb.db:8529
DB_USER=root
DB_NAME=track_dmarc
SA_USER_NAME=superuser@department.gc.ca
SA_PASSWORD=superadminpassword
SA_DISPLAY_NAME=superuser
EOF
```
Next some default credentials so we can log in to the Kiali observability tool.

```
cat <<'EOF' > app/minikube/kiali.env
username=admin
passphrase=admin
EOF
```
Then a password for our database.

```
cat <<'EOF' > app/minikube/arangodb.env
username=root
password=test
EOF
```

And finally the credentials needed for the API to talk to the database, and collaborative services like Notify.

```bash
cat <<'EOF' > app/minikube/api.env
DB_PASS=test
DB_URL=http://arangodb.db:8529
DB_NAME=track_dmarc
AUTHENTICATED_KEY=alonghash
SIGN_IN_KEY=alonghash
NOTIFICATION_API_KEY=test_key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NOTIFICATION_API_URL=https://api.notification.alpha.canada.ca
DMARC_REPORT_API_SECRET=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
TOKEN_HASH=somelonghash
DMARC_REPORT_API_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
DMARC_REPORT_API_URL=http://localhost:4001/graphql
DEPTH_LIMIT=15
COST_LIMIT=5000
SCALAR_COST=1
OBJECT_COST=1
LIST_FACTOR=1
EOF
```

Next we can start minikube (throwing lots of resources at it).

```
minikube start --cpus 4 --memory 20480
```

Last we use Kustomize to generate our config (creating Kubernetes secrets from the .env files we just created) and feed that config to `kubectl apply`.

There are two steps here, first the config in `platform/minikube` creates the CRDs needed for the app and installs [Istio](https://istio.io/).

```
kustomize build platform/minikube | kubectl apply -f -
```

Watch the results with `watch kubectl get pods -n istio-system`. Once Istio is running (and ready to inject it's sidecar proxies), the config for our app can be applied.

```
kustomize build app/minikube | kubectl apply -f -
```

Depending on the speed of your system you might need to run the kustomize/apply commands more than once.

### Seeing the  result:

The app lets you connect to both ports 80 and 443 (which is using a self signed certificate).

```bash
$ minikube service list
|-----------------|---------------------------|--------------|---------------------------|
|    NAMESPACE    |           NAME            | TARGET PORT  |            URL            |
|-----------------|---------------------------|--------------|---------------------------|
| api             | postgres                  | No node port |
| api             | tracker-api               | No node port |
| cert-manager    | cert-manager              | No node port |
| cert-manager    | cert-manager-webhook      | No node port |
| default         | kubernetes                | No node port |
| frontend        | tracker-frontend          | No node port |
| istio-system    | istio-ingressgateway      | http2/80     | http://192.168.49.2:32722 |
|                 |                           | https/443    | http://192.168.49.2:32114 |
```

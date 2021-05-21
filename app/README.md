# App manifest files

Trackers deployment configuration is split into app and platform sections. This folder contains the app manifests: The base deployment and Service objects along with the apps use of whatever CRDs are supplied by the platform.

Environment specific variations can be found in the subfolders of the overlays directory.
To generate these manifests you need to install [kustomize](https://kustomize.io/). 

Before applying these please check out the README.md in each overlay to understand the individual configurations.

## Getting started

In accordance with the [12Factor app](https://12factor.net) philosophy, all the services [draws their config from the environment](https://12factor.net/config). 
To generate the config needed to run a copy of the app, we need to define some `.env` files, that will be used to create Kubernetes secrets, whose values are available to the various parts of the app.

```
$ make credentials
Credentials written to app/creds/dev
```

Next we can start minikube (throwing lots of resources at it).

```
minikube start --cpus 8 --memory 20480
```
Then we load the secrets and platform config into minikube.

```
$ make secrets
$ make platform
```

Watch the results with `watch kubectl get pods -n istio-system`. Once Istio is running (and ready to inject it's sidecar proxies), the config for our app can be applied.

```
$ make app
```

Depending on the speed of your system you might need to run the kustomize/apply commands more than once.

### Seeing the  result:

The app lets you connect to both ports 80 and 443 (which is using a self signed certificate).

```bash
$ minikube service list
```

# App manifest files

Trackers deployment configuration is split into app and platform sections. This folder contains the app manifests: The base deployment and Service objects along with the apps use of whatever CRDs are supplied by the platform.

Environment specific variations can be found in the subfolders of the overlays directory.
To generate these manifests you need to install [kustomize](https://kustomize.io/).

Before applying these please check out the README.md in each overlay to understand the individual configurations.

## Getting started

In accordance with the [12Factor app](https://12factor.net) philosophy, all the services [draws their config from the environment](https://12factor.net/config).
To generate the config needed to run a copy of the app, we need to define some `.env` files, that will be used to create Kubernetes secrets, whose values are available to the various parts of the app.

```
# let the super user account be created with the default username/password
$ make credentials
# or override the default credentials by passing your own.
$ make credentials displayname=admin email=admin@example.com password=admin
```

Next we can start minikube (throwing lots of resources at it).

```
minikube start --cpus 8 --memory 20480
```

Then we load the secrets and platform config into minikube.

```
$ make secrets env=minikube
$ make platform env=minikube
```

Watch the results with `watch kubectl get pods -n istio-system`. Once Istio is running (and ready to inject its sidecar proxies), the config for our app can be applied.

```
$ make app env=minikube
```

Depending on the speed of your system you might need to run the kustomize/apply commands more than once.

### Seeing the result:

The app lets you connect to both ports 80 and 443 (which is using a self-signed certificate).

```bash
$ minikube service list
```

---

# Deploy

The Tracker project uses [Flux](https://fluxcd.io/), to enable [pull based](https://alex.kaskaso.li/post/pull-based-pipelines) Continuous Deployment.

The directory layout here to allow the patching of a basic flux install using [Kustomize](https://kustomize.io/).

## Testing config changes

Config changes can be pretty high impact, so trying it out somewhere is pretty useful. To that end, we have a few ways to bring up a "non-prod" version of the app; basically, using a self-signed cert and requesting its own IP address.

Containerized applications [read their config from the environment](https://12factor.net/config), and that environment is largely populated via secrets. Consequently, we create these secrets and the namespaces they live in before doing the deployment.

You can run `make credentials` in the project root to generate a basic set of dev credentials. Without passing any arguments, `make credentials` is equivalent to `make credentials mode=dev displayname=admin email=admin@example.com password=admin`. These default arguments set the credentials for the super admin user, and if you intend to log into your testing instance, make a note of those or adjust the arguments as needed.

In each of the cases below, `make deploy` installs flux into whatever cluster `kubectl` is currently pointing at. Flux will clone the Tracker repository and start applying the config it finds within to create a fully working instance of Tracker. This can take several minutes.

### Testing in Minikube

```bash
make secrets env=minikube
make deploy env=minikube
```

### Testing on GKE

```bash
make secrets env=test
make deploy env=test
```

### Testing on AKS

```bash
make secrets env=aks
make deploy env=aks
```

## Deploying to Prod

Deploying to prod is a little anticlimactic. You'll want some read/write credentials for Flux so that it can [update our config](https://toolkit.fluxcd.io/components/image/imageupdateautomations/#update-strategy) with new image tags, but everything else is the same.

Tracker uses SSH deploy keys to allow those updates, and uses kustomize to [generate secrets](https://github.com/kubernetes-sigs/kustomize/blob/master/examples/secretGeneratorPlugin.md#secret-values-from-local-files). To create the keys, use the following commands.

```bash
ssh-keygen -t ed25519 -q -N "" -C "flux-read-write" -f ./k8s/clusters/auto-image-update/bases/creds/identity
ssh-keyscan github.com > ./k8s/clusters/auto-image-update/bases/creds/known_hosts
```

[Add the new deploy key](https://github.com/canada-ca/tracker/settings/keys/new) to the Tracker repo, and select "Allow write access".
After that it's basically the same:

```bash
make secrets env=gke
make deploy env=gke
```

## Updating Flux

Update Flux [as you would normally](https://fluxcd.io/docs/installation/), and then run `make update-flux`, to update the config.

---

# Platform manifests

This folder contains the Custom Resource Definitions that the Tracker app relies on, as well as other platform layer stuff like [Istio](https://istio.io/), and [Cert Manager](https://cert-manager.io) that really is independent from our application.

As an example, the Tracker app uses a `Certificate` object to acquire a TLS certificate.

```
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  creationTimestamp: null
  name: ingress-cert
  namespace: istio-system
spec:
  commonName: tracker.alpha.canada.ca
  dnsNames:
  - tracker.alpha.canada.ca
  - suivi.alpha.canada.ca
  issuerRef:
    kind: Issuer
    name: selfsigned
  privateKey:
    algorithm: RSA
    encoding: PKCS8
    size: 4096
  secretName: tracker-credential
status: {}
```

`Certificate` is not a native Kubernetes object and is just assumed to exist in the environment. The manifests in this folder are all about defining generic objects like `Certificate` that the app can rely on without knowing how it got there.

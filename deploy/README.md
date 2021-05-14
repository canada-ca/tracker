# Deploy

The Tracker project uses [Flux](https://fluxcd.io/), to enable [pull based](https://alex.kaskaso.li/post/pull-based-pipelines) Continuous Deployment.

The directory here is laid out to allow the patching of a basic flux install. It is based on [the example](https://docs.fluxcd.io/en/1.18.0/tutorials/get-started-kustomize.html) in the documentation.

## Testing config changes

Config changes can be pretty high impact, so trying it out somewhere is pretty useful. To that end, we have a few ways to bring up a "non-prod" version of the app; basically, using a self signed cert and requesting its own IP address.

Containerized applications [read their config from the environment](https://12factor.net/config), and that environment is largely populated via secrets. Consequently we create these secrets and the namespaces they live in before doing the deployment.

See the readme in the app folder for instructions on how to create those app credentials.

### Testing in Minikube

```bash
make secrets env=minikube
make platform env=minikube
make app env=minikube
make deploy env=minikube
```

### Testing on GKE

```bash
make secrets env=test
make platform env=test
make app env=test
make deploy env=test
```

### Testing on AKS

```bash
make secrets env=aks
make platform env=aks
make app env=aks
make deploy env=aks
```

## Deploying to Prod

Deploying to prod is a little anticlimactic. You'll want some read/write credentials for Flux so that it can [update our config](https://toolkit.fluxcd.io/components/image/imageupdateautomations/#update-strategy) with new image tags, but everything else is the same.

Tracker uses SSH deploy keys to allow those updates, and uses kustomize to [generate secrets](https://github.com/kubernetes-sigs/kustomize/blob/master/examples/secretGeneratorPlugin.md#secret-values-from-local-files). To create the keys, use the following commands.

```bash
ssh-keygen -q -N "" -C "flux-read-write" -f ./deploy/creds/readwrite/identity
ssh-keyscan github.com > ./deploy/creds/readwrite/known_hosts
```

[Add the new deploy key](https://github.com/canada-ca/tracker/settings/keys/new) to the Tracker repo, and select "Allow write access".
After that it's basically the same:

```bash
make secrets env=gke
make platform env=gke
make app env=gke
make deploy env=gke
```


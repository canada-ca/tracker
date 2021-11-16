# Deploy

The Tracker project uses [Flux](https://fluxcd.io/), to enable [pull based](https://alex.kaskaso.li/post/pull-based-pipelines) Continuous Deployment.

The directory layout here to allow the patching of a basic flux install using [Kustomize](https://kustomize.io/).

## Testing config changes

Config changes can be pretty high impact, so trying it out somewhere is pretty useful. To that end, we have a few ways to bring up a "non-prod" version of the app; basically, using a self signed cert and requesting its own IP address.

Containerized applications [read their config from the environment](https://12factor.net/config), and that environment is largely populated via secrets. Consequently we create these secrets and the namespaces they live in before doing the deployment.

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
ssh-keygen -t ed25519 -q -N "" -C "flux-read-write" -f ./deploy/creds/readwrite/identity
ssh-keyscan github.com > ./deploy/creds/readwrite/known_hosts
```

[Add the new deploy key](https://github.com/canada-ca/tracker/settings/keys/new) to the Tracker repo, and select "Allow write access".
After that it's basically the same:

```bash
make secrets env=gke
make deploy env=gke
```

## Updating Flux

Update Flux [as you would normally](https://fluxcd.io/docs/installation/), and then run `make update-flux`, to update the config.

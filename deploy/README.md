# Deploy

The Tracker project uses [Flux](https://fluxcd.io/), to enable [pull based](https://alex.kaskaso.li/post/pull-based-pipelines) Continuous Deployment.

The directory here is laid out to allow the patching of a basic flux install. It is based on [the example](https://docs.fluxcd.io/en/1.18.0/tutorials/get-started-kustomize.html) in the documentation.

## Creating credentials for Flux

Tracker uses SSH deploy keys, and uses kustomize to [generate secrets](https://github.com/kubernetes-sigs/kustomize/blob/master/examples/secretGeneratorPlugin.md#secret-values-from-local-files). To create the keys, use the following commands.

```bash
ssh-keygen -q -N "" -C "flux-read-only" -f ./deploy/creds/readonly/identity
ssh-keyscan github.com > ./deploy/creds/readonly/known_hosts
```

With keys in hand, take the output of `cat deploy/creds/readonly/identity.pub` and [add a new deploy key](https://github.com/canada-ca/tracker/settings/keys/new) to the Tracker repo. Obviously only select "Allow write access" if you are creating a read/write key to allow Flux to automate deployments. Typically we'd only want read/write in production, and everything else using read.

## Testing config changes

Config changes can be pretty high impact, so trying it out somewhere is pretty useful. To that end, we have a few ways to bring up a "non-prod" version of the app; basically, using a self signed cert and requesting its own IP address.

Containerized applications [read their config from the environment](https://12factor.net/config), and that environment is largely populated via secrets. Consequently we create these secrets and the namespaces they live in before doing the deployment.

See the readme in the app folder for instructions on how to create those app credentials.

### Testing in Minikube

```bash
kustomize build platform/creds/dev | kubectl apply -f -
kustomize build app/creds/dev | kubectl apply -f -
kustomize build deploy/minikube | kubectl apply -f -
```

### Testing on GKE

```bash
kustomize build platform/creds/dev | kubectl apply -f -
kustomize build app/creds/dev | kubectl apply -f -
kustomize build deploy/test | kubectl apply -f -
```

### Testing on AKS

```bash
kustomize build platform/creds/dev | kubectl apply -f -
kustomize build app/creds/dev | kubectl apply -f -
kustomize build deploy/aks | kubectl apply -f -
```

## Deploying to Prod

Deploying to prod is a little anticlimactic. You'll want some read/write credentials for Flux so that it can [update our config](https://toolkit.fluxcd.io/components/image/imageupdateautomations/#update-strategy) with new image tags, but everything else is the same.

```bash
ssh-keygen -q -N "" -C "flux-read-write" -f ./deploy/creds/readwrite/identity
ssh-keyscan github.com > ./deploy/creds/readwrite/known_hosts
```

```bash
kustomize build platform/creds/prod | kubectl apply -f -
kustomize build app/creds/prod | kubectl apply -f -
kustomize build deploy/gke | kubectl apply -f -
```


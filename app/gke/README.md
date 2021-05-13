# Google Kubernetes Engine

The files in this folder are patches and additions to the base configuration
stored in the bases folder. These patches and additions provide all the needed
tweaks and configuration needed to run the app on GKE.

## Deploying on GKE

Deploying to GKE looks pretty much like our other deployments.

You will need proper credentials for this, including referencing all the right templates on [Notify](https://notification.canada.ca/) and `make credentials mode=prod` can give you a head start.

The rest is pretty much the same:

```sh
make cluster name=tracker
make secrets env=gke
make platform env=gke
make app env=gke
make deploy env=gke
```

The last command `make deploy` sets up [Flux](https://fluxcd.io/) inside the cluster, so it can automate deployments.

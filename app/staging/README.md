# Staging on AKS

The purpose of this overlay is to bring up Tracker on AKS in a Staging config. The config here is just a draft. We're just getting started!

If you need some dev credentials for this test cluster, you can generate them with `make credentials mode=dev`.

## Bringing up a cluster on AKS

Normally we would create the cluster with `make cluster`, but we haven't gotten an AKS equivalent worked out yet. In the absence of that, we'll just assume you already have a 6 node cluster somehow, and `kubectl` configured to talk to it.

## Installing Tracker

Just run the following commands.

```sh
make secrets env=aks
# If either of these fail, just run them again
make platform env=staging
make app env=staging
```
Or as an alternate path, you could install flux and let it do the work for you.

```sh
make secrets env=aks
make deploy env=staging
```

If you want to watch the pod creation process, you can do it with this:

```sh
watch kubectl get po -A
```

That will bring the cluster up with a self-signed certificate. To connect to it, we just need the external IP.

```sh
kubectl get svc -n istio-system istio-ingressgateway
```

Connecting to both `https://<externalip>` and `https://<externalip>/graphql` should succeed. Reaching the frontend and API respectively.

## Loading data

The database isn't exposed to the outside world, so loading data requires you to forward the database ports to your local machine.

```sh
kubectl port-forward -n db svc/arangodb 8529:8529
```

With that port forwarding in place, you can now load/dump with the following commands:

```sh
make backup to=~/track_dmarc-$(date --iso-8601)
make restore from=~/track_dmarc-2021-05-12
```

# Test

The purpose of this overlay is to bring up a "non-prod" copy of the full application on GKE, for... you guessed it, testing purposes! This configuration will come up using a self-signed certificate, but other than that it should be almost identical to production.

Since testing usually involves trying stuff that isn't committed to master yet, the commands to get things working are a little different from a normal deployment.

If you need some dev credentials for this test cluster, you can generate them with `make credentials mode=dev`.

## Bringing up a test cluster on GKE

Currently, we are just creating the cluster with the following command.


```sh
make cluster
make secrets env=test
# If either of these fail, just run them again
make platform env=test
make app env=test
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
arangodump --server.database track_dmarc --output-directory track_dmarc-$(date --iso-8601)
arangorestore --create-database --server.database track_dmarc --input-directory track_dmarc-2021-05-12
```

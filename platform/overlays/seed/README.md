# Flux

This overlay bootstraps a cluster with [Flux](https://fluxcd.io/), getting [pull based](https://alex.kaskaso.li/post/pull-based-pipelines) Continuous Deployment going.

The assumption is that you have created a cluster already. To setup flux you will need a gpg key for flux to use to decrypt secrets. The private key will then live in the cluster.
First `gpg --full-gen-key` to generate an `RSA and RSA` key, that does not have a password.

Assuming the id of the key is 2169XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX, then you will create a kubernetes secret containing the key in the flux namespace with the following command:

```bash
gpg --export-secret-keys --armor 2169XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | kubectl create secret generic flux-gpg-signing-key --namespace=flux --from-file=flux.asc=/dev/stdin --dry-run -o yaml > flux-gpg-signing-key.yaml
```

With that key created you can seed the cluster by running `kustomize build . | kubectl apply -f -` in this directory.

When Flux starts it will print out it's public key in the logs. Use that key to create a deploy key with write access [on GitHub](https://github.com/canada-ca/tracker/settings/keys).

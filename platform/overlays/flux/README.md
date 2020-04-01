# Flux

This overlay bootstraps a cluster with [Flux](https://fluxcd.io/), getting [pull based](https://alex.kaskaso.li/post/pull-based-pipelines) Continuous Deployment going.

To set this up you will need a gpg key for flux to use to decrypt secrets. The private key will then live in the cluster.
First `gpg --full-gen-key` to generate an `RSA and RSA` key, that does not have a password.

Assuming the id of the key is 2169XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX, then you will create a kubernetes secret containing the key with the following command:

```bash

gpg --export-secret-keys --armor 2169XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | kubectl create secret generic flux-gpg-signing-key --from-file=flux.asc=/dev/stdin --dry-run -o yaml > flux-gpg-signing-key.yaml
```

With that key created you can seed the cluster by running `kustomize build . | kubectl apply -f -` in this directory.

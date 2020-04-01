# Flux

This overlay bootstraps a cluster with [Flux](https://fluxcd.io/), getting [pull based](https://alex.kaskaso.li/post/pull-based-pipelines) Continuous Deployment going.

The directory here is laid out to allow the patching of a basic flux install. It is based on [the example](https://docs.fluxcd.io/en/1.18.0/tutorials/get-started-kustomize.html) in the documentation.

```bash
[mike@ouroboros flux]$ tree
.
├── api-namespace.yaml
├── bases
│   ├── flux-account.yaml
│   ├── flux-deployment.yaml
│   ├── flux-ns.yaml
│   ├── flux-secret.yaml
│   ├── kustomization.yaml
│   ├── memcache-dep.yaml
│   └── memcache-svc.yaml
├── frontend-namespace.yaml
├── kustomization.yaml
├── memcached-dep.yaml
├── patch.yaml
└── README.md
```

To deploy flux run `kustomize build . | kubectl apply -f -` in the current directory.

When Flux starts it will print out it's public key in the logs. Use that key to create a deploy key with write access [on GitHub](https://github.com/canada-ca/tracker/settings/keys).

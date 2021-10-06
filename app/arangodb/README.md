# ArangoDB

This is just to make working with Kube-ArangoDB a little easier. Upgrading the operator basically just looks like incrementing the version numbers in the kustomization file and then running the following command:

```
kustomize build app/arangodb/ > app/bases/arangodb-operator.yaml
```

# Generate dev secrets

This config is included in others (like minikube) and you probably don't need to run it directly.

If you do need *just* the dev secrets, follow the tutorial in the root of the app directory and With the `.env` files in place, run the following command:

```
kustomize build app/creds/dev | kubectl apply -f -
```

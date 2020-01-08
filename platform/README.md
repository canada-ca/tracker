# Kubernetes manifest files

**IS THAT A SECRET IN `./azure/tracker-secret.yaml`?**
Yes. It is the read-only connection string to a CosmoDB full of dummy data.

### Purpose
The purpose of this directory is to hold the manifest files for kubernetes deployments across various platforms. To use these deployments you need to install [kustomize](https://github.com/kubernetes-sigs/kustomize). 

Before applying these please check out the README.md in each overlay to understand the individual configurations,

Assuming you have `kubectl` set to the proper context you can then run:

`kustomize build overlays/minikube | kubectl apply -f -`
or 
`kustomize build overlays/minikube | kubectl delete -f -`

to provision or tear down a cluster.
To make this slightly easier there is a `package.json` that wraps these so you can use `npm` or `yarn`:
`yarn minikube`
`npm run delete-minikube`
or
`yarn azure`
`npm run delete-azure`


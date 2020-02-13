# Kubernetes manifest files

The purpose of this directory is to hold the manifest files for kubernetes deployments across various platforms. To use these deployments you need to install [kustomize](https://kustomize.io/). 

Before applying these please check out the README.md in each overlay to understand the individual configurations.

Assuming you have `kubectl` set to the proper context you can then run:

`kustomize build overlays/minikube | kubectl apply -f -`
or 
`kustomize build overlays/minikube | kubectl delete -f -`

to provision or tear down a cluster.

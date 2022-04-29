# Minikube

The files in this folder are patches and additions to the base configuration stored in the bases folder.
These patches and additions provide all the needed tweaks and configuration needed to run the app locally in Minikube.


## Running Minikube
With those files created you can start minikube and the app with the following commands in root directory. Both minikube and Istio require a lot of resources... so throw everything you can at it.

```bash
minikube start --cpus 8 --memory 20480
minikube service list
```

## Installing Tracker

With Minikube up and running we can stand up Tracker with just a few commands.

```bash
make secrets env=minikube
make platform env=minikube
make app env=minikube
```

## Inspecting what's running

Minikube will show you the running services with the following command.

```bash
minikube service list
```

You can obviously inspect what's running with `kubectl` as well.

```bash
watch kubectl get pods -A
```

And to see what's happening through Kiali, you can use the `istioctl` command to launch the dashboard.

```bash
istioctl dashboard kiali
```

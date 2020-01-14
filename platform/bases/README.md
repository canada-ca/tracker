# Minikube overlay

This will deploy the application on minikube. It deploys the tracker as a cron job that runs every 10 minutes with dummy data that is pulled in through an `initContainer`. The dummy data in this init container can be swapped out by pushing a new images to `gcr.io/cdssnc/tracker-sample-data`. Data is written to a locally provisioned MongoDB.

Once it is deployed, the application can be accessed by running:

`minikube service --namespace=kube-system traefik-ingress-service`
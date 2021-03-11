# Test

The purpose of this overlay is to bring up a "non-prod" copy of the full application on GKE, for... you guessed it, testing purposes! This configuration will come up using a self signed certificate, but other than that it should be almost identical to production.

Since testing usually involves trying stuff that isn't commited to master yet, the commands to get things working are a little different from a normal deployment.


## Bringing up a cluster

Currently we are just creating the cluster with the following command.

```sh
gcloud beta container --project "track-compliance" clusters create "testing" \
 --region "northamerica-northeast1" --no-enable-basic-auth \
 --cluster-version "1.18.9-gke.801" --release-channel "rapid" \
 --machine-type "e2-standard-2" --image-type "COS_CONTAINERD" \
 --disk-type "pd-standard" --disk-size "100" \
 --metadata disable-legacy-endpoints=true \
 --service-account "gke-node-service-account@track-compliance.iam.gserviceaccount.com" \
 --num-nodes "2" --enable-stackdriver-kubernetes --enable-ip-alias \
 --network "projects/track-compliance/global/networks/default" \
 --subnetwork "projects/track-compliance/regions/northamerica-northeast1/subnetworks/default" \
 --default-max-pods-per-node "110" --no-enable-master-authorized-networks \
 --addons HorizontalPodAutoscaling,HttpLoadBalancing,CloudRun --enable-autoupgrade \
 --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0 \
 --workload-pool "track-compliance.svc.id.goog" \
 --enable-shielded-nodes --shielded-secure-boot
```

With the cluster up and running, you will need to provide the env files as
described in the minikube setup:

```sh
api.env
kiali.env
kiali.yaml
postgres.env
scanners.env
```
With those in place, the config can now be generated.

```sh
# Create namespaces and secrets
kustomize build app/creds/dev | kubectl apply -f -
kustomize build platform/creds/dev | kubectl apply -f -

# create platform CRDs and pods
kustomize build platform/test | kubectl apply -f -

kustomize build overlays/seed/test | kubectl apply -f -
# Watch until istio is ready
watch kubectl get po -A

# create the app
kustomize build app/test | kubectl apply -f -

# Watch until everything is running
watch kubectl get po -A

# Get the IP of the app
kubectl get svc -n istio-system istio-ingressgateway -o json | jq '.status.loadBalancer.ingress'
```

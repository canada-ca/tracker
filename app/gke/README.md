# Google Kubernetes Engine

The files in this folder are patches and additions to the base configuration
stored in the bases folder. These patches and additions provide all the needed
tweaks and configuration needed to run the app on GKE.

The `istio.yaml` file in this folder is generated with the following command:

```sh
istioctl manifest generate --set meshConfig.accessLogFile=/dev/stdout --set meshConfig.accessLogEncoding=JSON > platform/base/istio.yaml
```

## Creating the cluster

Currently we are just creating the cluster with the following command.

```sh
gcloud beta container --project "track-compliance" clusters create "tracker" \
  --region "northamerica-northeast1" --no-enable-basic-auth --release-channel "regular" \
  --machine-type "e2-highcpu-4" --image-type "COS_CONTAINERD" --disk-type "pd-standard" \
  --disk-size "50" --metadata disable-legacy-endpoints=true \
  --service-account "gke-node-service-account@track-compliance.iam.gserviceaccount.com" \
  --num-nodes "2" --enable-stackdriver-kubernetes --enable-ip-alias \
  --network "projects/track-compliance/global/networks/default" \
  --subnetwork "projects/track-compliance/regions/northamerica-northeast1/subnetworks/default" \
  --no-enable-master-authorized-networks \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,CloudRun \
  --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0 \
  --workload-pool "track-compliance.svc.id.goog" --enable-shielded-nodes --shielded-secure-boot
```

The number of options here testify to our increasingly opinionated take on
cluster creation, as well as our attention to the [hardening guidelines for
GKE](https://cloud.google.com/kubernetes-engine/docs/how-to/hardening-your-cluster).
This will soon be captured in real code in a proper Infrastructure as Code type
of way.

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
kustomize build platform/overlays/gke | kubectl apply -f -
```

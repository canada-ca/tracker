# Google Kubernetes Engine

The files in this folder are patches and additions to the base configuration
stored in the bases folder.  These patches and additions provide all the needed
tweaks and configuration needed to run the app on GKE.

The `istio.yaml` file in this folder is generated with the following command:

```sh
istioctl manifest generate --set values.kiali.enabled=true \
  --set values.tracing.enabled=true \
  --set values.pilot.traceSampling=100 \
  --set meshConfig.accessLogFile="/dev/stdout" \
  --set values.gateways.istio-ingressgateway.loadBalancerIP=34.95.5.243 > istio.yaml
```

Inside the config that is generated is a service definition that currently needs to be modified to ensure that unneeded ports are not opened. This means editing the istio.yaml file and appending the following at the end.

```bash
 apiVersion: v1
 kind: Service
 metadata:
   annotations: null
   labels:
     app: istio-ingressgateway
     istio: ingressgateway
     release: istio
   name: istio-ingressgateway
   namespace: istio-system
 spec:
   ports:
-  - name: status-port
-    port: 15021
-    targetPort: 15021
   - name: http2
     port: 80
     targetPort: 8080
   - name: https
     port: 443
     targetPort: 8443
-  - name: tls
-    port: 15443
-    targetPort: 15443
   selector:
     app: istio-ingressgateway
     istio: ingressgateway
   type: LoadBalancer
---
```

That patches the `istio.yaml` in the bases folder with the loadbalancer config
needed for GKE.


## Creating the cluster

Currently we are just creating the cluster with the following command.

```sh
gcloud beta container --project "track-compliance" clusters create "pulse-of-the-gc" \
  --region "northamerica-northeast1" --no-enable-basic-auth \
  --release-channel "regular" --machine-type "n1-standard-4" \
  --image-type "COS_CONTAINERD" --disk-type "pd-standard" --disk-size "100" \
  --metadata disable-legacy-endpoints=true \
  --service-account "gke-node-service-account@track-compliance.iam.gserviceaccount.com"\
  --num-nodes "1" --enable-stackdriver-kubernetes --enable-ip-alias \
  --network "projects/track-compliance/global/networks/default"\
  --subnetwork "projects/track-compliance/regions/northamerica-northeast1/subnetworks/default" \
  --default-max-pods-per-node "110" --no-enable-master-authorized-networks \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,CloudRun --enable-autoupgrade \
  --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0 \
  --identity-namespace "track-compliance.svc.id.goog" \
  --enable-shielded-nodes --shielded-secure-boot
```

The number of options here testify to our increasingly opinionated take on
cluster creation, as well as our attention to the [hardening guidelines for
GKE](https://cloud.google.com/kubernetes-engine/docs/how-to/hardening-your-cluster).
This will soon be captured in real code in a proper Infrastructure as Code type
of way.

With the cluster created the next step is to seed the cluster with the
namespaces and secrets needed. If you've followed the instructions in
`overlays/seed` directory you should be able to run the following and have it
succeed.

```sh
kustomize build platform/overlays/seed | kubectl apply -f -
```

If that succeeds, all that is left is the application itself.

```sh
kustomize build platform/overlays/gke | kubectl apply -f -
```

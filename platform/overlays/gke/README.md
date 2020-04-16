# Google Kubenetes Engine

The files in this folder are patches and additions to the base configuration
stored in the bases folder.  These patches and additions provide all the needed
tweaks and configuration needed to run the app on GKE.

The `istio.yaml` file in this folder is generated with the following command:

```sh
istioctl manifest generate --set values.kiali.enabled=true \
  --set values.tracing.enabled=true \
  --set values.global.proxy.accessLogFile="/dev/stdout" \
  --set values.gateways.istio-ingressgateway.loadBalancerIP=34.95.5.243 > istio.yaml
```

That patches the `istio.yaml` in the bases folder with the loadbalancer config
needed for GKE.

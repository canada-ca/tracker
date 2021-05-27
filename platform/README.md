# Platform manifests

This folder contains the Custom Resource Definitions that the Tracker app relies on, as well as other platform layer stuff like [Istio](https://istio.io/), and [Cert Manager](https://cert-manager.io) that really is independent from our application.

As an example, the Tracker app uses a `Certificate` object to acquire a TLS certificate. 

```
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  creationTimestamp: null
  name: ingress-cert
  namespace: istio-system
spec:
  commonName: tracker.alpha.canada.ca
  dnsNames:
  - tracker.alpha.canada.ca
  - suivi.alpha.canada.ca
  issuerRef:
    kind: Issuer
    name: selfsigned
  privateKey:
    algorithm: RSA
    encoding: PKCS8
    size: 4096
  secretName: tracker-credential
status: {}
```

`Certificate` is not a native Kubernetes object and is just assumed to exist in the environment. The manifests in this folder are all about defining generic objects like `Certificate` that the app can rely on without knowing how it got there.

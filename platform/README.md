# Platform manifests

This folder contains the Custom Resource Definitions that the Tracker app relies on, as well as "infrastructure" stuff like Istio, that really is independent from our application.

As an example, the Tracker app uses a `Certificate` object to acquire a TLS certificate. 

```
apiVersion: cert-manager.io/v1alpha2
kind: Certificate
metadata:
  name: ingress-cert
  namespace: istio-system
spec:
  keySize: 4096
  keyAlgorithm: rsa
  keyEncoding: pkcs8
  secretName: tracker-credential
  issuerRef:
    name: selfsigned
    kind: Issuer
  commonName: pulse.alpha.canada.ca
  dnsNames:
  - pulse.alpha.canada.ca
  - pouls.alpha.canada.ca
```

`Certificate` is not a native Kubernetes object and is just assumed to exist in the environment. The manifests in this folder are all about defining generic objects like `Certificate` that the app can rely on without knowing how it got there.

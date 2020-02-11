# Google Kubenetes Engine

The files in this folder are patches and additions to the base configuration
stored in the bases folder.  These patches and additions provide all the needed
tweaks and configuration needed to run the app on GKE.

This config assumes that Istio is already resident in the cluster, so you will
need to create the cluster with the `--addons=Istio` and
`--istio-config-auth=MTLS_PERMISSIVE` options.


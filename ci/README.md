# CI build image

This folder contains the docker image that is used in the build process.
You can see it in the cloudbuild.yaml files under the name "track-compliance/ci".

To build a copy of this image:

```sh
docker build -t gcr.io/track-compliance/ci .
```
To push to the registry you will need to configure docker with proper credentials.

```sh
gcloud auth configure-docker
docker push gcr.io/track-compliance/ci
```

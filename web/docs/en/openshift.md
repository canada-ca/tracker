## OpenShift deployment

### Before you start
Please make sure you have the docker image pre-built in a docker registry that your environment can pull from.

### Setup

#### Required software

Have a copy of [MiniShift](https://github.com/minishift/minishift) or [Openshift](https://www.openshift.org/) installed and configured.

Also have a copy of the [oc client](https://www.openshift.org/download.html) installed and connected to the service.

### Environment

First create a new project

```
oc new-project track-web
oc project track-web
````

From the web interface add a new database MongoDB to add to the track-web project. Please make sure to *NOT* select Ephemeral if
you wish for data to persist.

On the Configuration tab change the database name to "trackweb" and enter a secure database username and password to use.


Setup an imagestream to pull the container image from your registry source and create an app for it
```
oc -n track-web import-image track-web-latest \
                --confirm --scheduled=true \
                --from=registry.tld/namespace/project:latest
```

Setup a new `vi deployment.yaml` for this image (Note: customize the MongoDB environment and the image to pull in the file)
```yaml
kind: DeploymentConfig
metadata:
  name: track-web-latest
spec:
  replicas: 1
  strategy:
    type: Rolling
  revisionHistoryLimit: 2
  template:
    metadata:
      labels:
        name: track-web-latest
    spec:
      containers:
      - env:
        - name: TRACKER_MONGO_URI
          value: mongodb://DBUSERNAME:DBPASSWORD@mongodb:27017/trackweb
        - name: TRACKER_ENV
          value: production
        image: registry.tld/namespace/project:latest
        imagePullPolicy: Always
        name: track-web-latest
        ports:
        - containerPort: 5000
          protocol: TCP
  triggers:
  - type: ConfigChange
  - imageChangeParams:
      automatic: true
      containerNames:
      - track-web-latest
      from:
        kind: ImageStreamTag
        name: track-web-latest:latest
    type: ImageChange
```

Deploy the deployment yaml file
```
oc -n track-web create -f deployment.yaml
```

Create a `vi service.yaml` file to connect ports
```yaml
kind: Service
metadata:
  name: track-web-latest
spec:
  ports:
  - name: 5000-tcp
    port: 5000
    protocol: TCP
    targetPort: 5000
  selector:
    deploymentconfig: track-web-latest
  type: ClusterIP
status:
  loadBalancer: {}
```

Deploy the service yaml file
```
oc -n track-web create -f service.yaml
```

Now setup a `vi route.yaml` into the application stack to the app container
```yaml
kind: Route
metadata:
  labels:
    app: track-web-latest
  name: track-web-latest
spec:
  port:
    targetPort: 5000-tcp
  tls:
    insecureEdgeTerminationPolicy: Redirect
    termination: edge
  to:
    kind: Service
    name: track-web-latest
    weight: 100
  wildcardPolicy: None
```

Deploy the route yaml file
```
oc -n track-web create -f route.yaml
```

### Usage

To find the URL the application should be accessible at look at the route created for the host/port name
```
oc -n track-web get routes
```

## Purpose

The purpose of this directory is to create a docker image that has sample data for the tracker application. The idea is to preload the data into the main container image in kubernetes using an init container.

For example
```
initContainers:
  - image: 'gcr.io/cdssnc/tracker-sample-data'
    imagePullPolicy: Always
    name: 'tracker-data'
    command: [ "/bin/sh", "-ce", "cp /sample_data/* /csv" ]
    volumeMounts:
    - name: csv-claim
      mountPath: /csv
```

will copy the sample data into the `/csv` directory of the tracker image.
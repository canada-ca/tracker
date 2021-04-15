This directory contains manifests for the execution of one-off tasks that shouldn't be scheduled.

E.g. Initiation of scans or core service outside of regularly scheduled execution.

Deploying each file using kubectl -n <namespace> -f <file> will create a Kubernetes job which will only be performed once.

The naming scheme for these manifests should be <job_name>-job.yaml.

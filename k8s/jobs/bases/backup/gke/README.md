# Backup to Google Cloud Storage

In keeping with the Directive to ["Design for cloud mobility"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32602#claA.2.3.11.3), Tracker uses the multi-cloud backup tool [rclone](https://rclone.org) to back up the database to [Google Cloud Storage](https://cloud.google.com/storage)aka GCS.

## Permissions

On GKE the backup service uses [workload identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity) to authenticate itself to GCS. Workload identity connects Kubernetes service accounts with the IAM accounts and the roles and permissions of GCP.

For the backup to succeed, you need to create these accounts and mappings.

```
gcloud iam service-accounts create backup-service

gcloud iam service-accounts add-iam-policy-binding --role roles/iam.workloadIdentityUser --member "serviceAccount:track-compliance.svc.id.goog[db/backup-service]" backup-service@track-compliance.iam.gserviceaccount.com

gcloud iam roles create backupService --project track-compliance --title "Backup Service" --description "Write and view objects only" --permissions storage.objects.list,storage.objects.create

gcloud projects add-iam-policy-binding track-compliance --member=serviceAccount:backup-service@track-compliance.iam.gserviceaccount.com --role=roles/backupService
```

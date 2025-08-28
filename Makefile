#################################################################################
# GLOBALS                                                                       #
#################################################################################

project = track-compliance
name = test
region = northamerica-northeast1
mode = dev
env = test
displayname=admin
SA_USER_USERNAME=admin@example.com
SA_USER_PASSWORD=admin

define scanners =
endef

.PHONY: cluster
cluster:
		gcloud container --project "$(project)" clusters create "$(name)" --region "$(region)" --no-enable-basic-auth --release-channel "stable" --cluster-version "1.24.11-gke.1000" --machine-type "n2d-standard-4" --image-type "COS_CONTAINERD" --disk-type "pd-standard" --disk-size "50" --metadata disable-legacy-endpoints=true --service-account "gke-least-priviledge-account@$(project).iam.gserviceaccount.com" --num-nodes "2" --logging=SYSTEM,WORKLOAD --monitoring=SYSTEM --enable-ip-alias --network "projects/$(project)/global/networks/default" --subnetwork "projects/$(project)/regions/northamerica-northeast1/subnetworks/default" --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0 --workload-pool "$(project).svc.id.goog" --enable-shielded-nodes --enable-dataplane-v2 --shielded-secure-boot --shielded-integrity-monitoring

.PHONY: gke-service-account
gke-service-account:
		gcloud iam service-accounts create gke-least-priviledge-account --display-name="gke least priviledge account"
		gcloud projects add-iam-policy-binding php-observatory --member "serviceAccount:gke-least-priviledge-account@php-observatory.iam.gserviceaccount.com" --role roles/logging.logWriter
		gcloud projects add-iam-policy-binding php-observatory --member "serviceAccount:gke-least-priviledge-account@php-observatory.iam.gserviceaccount.com" --role roles/monitoring.metricWriter
		gcloud projects add-iam-policy-binding php-observatory --member "serviceAccount:gke-least-priviledge-account@php-observatory.iam.gserviceaccount.com" --role roles/monitoring.viewer
		gcloud projects add-iam-policy-binding php-observatory --member "serviceAccount:gke-least-priviledge-account@php-observatory.iam.gserviceaccount.com" --role roles/stackdriver.resourceMetadata.writer


.PHONY: secrets
secrets:
		kustomize build k8s/apps/bases/api/creds | kubectl apply -f -
		kustomize build k8s/apps/bases/scanners/dmarc-report-cronjob/creds | kubectl apply -f -
		kustomize build k8s/apps/bases/scanners/scanner-platform/creds | kubectl apply -f -
		kustomize build k8s/apps/bases/super-admin/creds | kubectl apply -f -
		kustomize build k8s/apps/bases/arangodb/creds | kubectl apply -f -
		kustomize build k8s/clusters/auto-image-update/bases/creds | kubectl apply -f -

.PHONY: dbdump
dbdump:
		arangodump --include-system-collections true --server.database track_dmarc --output-directory $(to)

.PHONY: restore
restore:
		arangorestore --server.database track_dmarc --create-collection false --include-system-collections true --input-directory $(from)

.PHONY: install-arango-operator
install-arango-operator:
		kubectl apply -f $(arango_operator_manifest_url_prefix)/arango-crd.yaml
		kubectl apply -f $(arango_operator_manifest_url_prefix)/arango-deployment.yaml

.PHONY: update-flux
update-flux:
		flux install --components=source-controller,kustomize-controller,notification-controller,image-reflector-controller,image-automation-controller --export > k8s/clusters/platform/crds.yaml

.PHONY: update-istio
update-istio:
		istioctl manifest generate -f k8s/infrastructure/bases/istio/istio-operator.yaml --dry-run > k8s/infrastructure/bases/istio/platform/crds.yaml

.PHONY: print-arango-deployment
print-arango-deployment:
		kustomize build k8s/infrastructure/bases/arangodb | yq -y '. | select(.kind == "ArangoDeployment" and .metadata.name == "arangodb")'

.PHONY: print-istio-operator
print-istio-operator:
		kustomize build k8s/infrastructure/overlays/$(env) | yq -y '. | select(.kind == "IstioOperator" and .metadata.name == "istio-operator")'

.PHONY: platform
platform:
		kustomize build k8s/infrastructure/overlays/$(env) | kubectl apply -f -

.PHONY: deploy
deploy:
ifeq ("$(env)", "gke")
		kustomize build k8s/clusters/auto-image-update/bases/creds | kubectl apply -f -
		kustomize build k8s/infrastructure/overlays/$(env) | kubectl apply -f -
		kustomize build k8s/apps/overlays/$(env) | kubectl apply -f -
else
		kustomize build k8s/infrastructure/overlays/$(env) | kubectl apply -f -
		kustomize build k8s/apps/overlays/$(env) | kubectl apply -f -
endif

.PHONY: app
app:
		kubectl apply -k k8s/overlays/$(env)

.PHONY: scan
scan:
		kubectl delete job domain-dispatcher-manual -n scanners --ignore-not-found &&
		kubectl create job domain-dispatcher-manual --from=cronjob/domain-dispatcher -n scanners

.PHONY: detect-decay
detect-decay:
		kubectl delete job detect-decay-manual -n scanners --ignore-not-found &&
		kubectl create job detect-decay-manual --from=cronjob/detect-decay -n scanners

.PHONY: scanners
scanners:
		kustomize build scanners | kubectl apply -f -

.PHONY: backup
backup:
		kubectl delete job arangodb-backup-manual -n db --ignore-not-found &&
		kubectl create job arangodb-backup-manual -n db --from=cronjob/backup

.PHONY: superadmin
superadmin:
		kubectl apply -k k8s/jobs/super-admin

.PHONY: guidance
guidance:
		kubectl apply -f services/guidance/guidance-job.yaml

.PHONY: summaries
summaries:
		kubectl delete job summaries-manual -n scanners --ignore-not-found &&
		kubectl create job summaries-manual --from=cronjob/summaries -n scanners

.PHONY: domain-cleanup
domain-cleanup:
		kubectl delete job domain-cleanup-manual -n api --ignore-not-found &&
		kubectl create job domain-cleanup-manual --from=cronjob/domain-cleanup -n api

.PHONY: reports
reports:
		kubectl delete job dmarc-report-manual -n scanners --ignore-not-found &&
		kubectl create job dmarc-report-manual --from=cronjob/dmarc-report -n scanners

.ONESHELL:
.PHONY: credentials
credentials:
		@cat <<-'EOF' > k8s/apps/bases/scanners/scanner-platform/creds/scanners.env
		DB_PASS=test
		DB_URL=http://arangodb.db:8529
		DB_USER=root
		DB_NAME=track_dmarc
		EOF
		cat <<-'EOF' > k8s/infrastructure/bases/arangodb/creds/arangodb.env
		username=root
		password=test
		EOF
		cat <<-'EOF' > k8s/apps/bases/scanners/dmarc-report-cronjob/creds/dmarc.env
		DB_PASS=dbpass
		DB_URL=http://arangodb.db:8529/
		DB_NAME=track_dmarc
		GITHUB_BRANCH=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
		GITHUB_FILE=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
		GITHUB_OWNER=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
		GITHUB_REPO=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
		GITHUB_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
		GITHUB_URL=https://api.github.com/graphql
		AZURE_CONN_STRING=???
		DATABASE=tbs-tracker
		SUMMARIES_CONTAINER=tbs-tracker-summaries
		EOF
		cat <<-'EOF' > k8s/apps/bases/api/creds/api.env
		AUTHENTICATED_KEY=alonghash
		AUTH_TOKEN_EXPIRY=60
		CIPHER_KEY=1234averyveryveryveryverylongkey
		COST_LIMIT=75000
		DB_NAME=track_dmarc
		DB_PASS=test
		DB_URL=http://arangodb.db:8529
		DEPTH_LIMIT=15
		HASHING_SALT=somerandomvalue
		LIST_FACTOR=1
		LOGIN_REQUIRED=true
		NATS_URL=nats://nats:4222
		NOTIFICATION_API_KEY=test_key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
		NOTIFICATION_API_URL=https://api.notification.alpha.canada.ca
		NOTIFICATION_AUTHENTICATE_EMAIL_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_AUTHENTICATE_TEXT_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_ORG_INVITE_BILINGUAL=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_BILINGUAL=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_ORG_INVITE_REQUEST_BILINGUAL=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_PASSWORD_RESET_BILINGUAL=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_TWO_FACTOR_CODE_EN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_TWO_FACTOR_CODE_FR=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_VERIFICATION_EMAIL_EN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_VERIFICATION_EMAIL_FR=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		OBJECT_COST=1
		REFRESH_KEY=alonghash
		REFRESH_TOKEN_EXPIRY=7
		SCALAR_COST=1
		SERVICE_ACCOUNT_EMAIL=xxxxxx@xxxx
		SIGN_IN_KEY=alonghash
		TRACING_ENABLED=false
		EOF
		cat <<-'EOF' > k8s/jobs/super-admin/creds/super-admin.env
		DB_PASS=test
		DB_URL=arangodb.db:8529
		DB_NAME=track_dmarc
		SA_USER_DISPLAY_NAME=$(displayname)
		SA_USER_USERNAME=$(username)
		SA_USER_PASSWORD=$(password)
		SA_USER_LANG=en
		SA_ORG_EN_SLUG=sa
		SA_ORG_EN_ACRONYM=SA
		SA_ORG_EN_NAME=Super Admin
		SA_ORG_EN_ZONE=FED
		SA_ORG_EN_SECTOR=TBS
		SA_ORG_EN_COUNTRY=Canada
		SA_ORG_EN_PROVINCE=Ontario
		SA_ORG_EN_CITY=Ottawa
		SA_ORG_FR_SLUG=sa
		SA_ORG_FR_ACRONYM=SA
		SA_ORG_FR_NAME=Super Admin
		SA_ORG_FR_ZONE=FED
		SA_ORG_FR_SECTOR=TBS
		SA_ORG_FR_COUNTRY=Canada
		SA_ORG_FR_PROVINCE=Ontario
		SA_ORG_FR_CITY=Ottawa
		EOF
		echo "Credentials written"

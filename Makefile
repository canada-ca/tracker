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
		gcloud beta container --project "$(project)" clusters create "$(name)" --region "$(region)" --no-enable-basic-auth --release-channel "rapid" --machine-type "n2d-standard-4" --image-type "COS_CONTAINERD" --disk-type "pd-standard" --disk-size "50" --metadata disable-legacy-endpoints=true --service-account "gke-node-service-account@track-compliance.iam.gserviceaccount.com" --num-nodes "2" --logging=SYSTEM,WORKLOAD --monitoring=SYSTEM,WORKLOAD --enable-ip-alias --network "projects/track-compliance/global/networks/default" --subnetwork "projects/track-compliance/regions/northamerica-northeast1/subnetworks/default" --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0 --workload-pool "track-compliance.svc.id.goog" --enable-shielded-nodes --enable-dataplane-v2 --shielded-secure-boot --shielded-integrity-monitoring

.PHONY: secrets
secrets:
		kustomize build platform/creds/${mode} | kubectl apply -f -
		kustomize build app/creds/${mode} | kubectl apply -f -

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
		flux install --components=source-controller,kustomize-controller,notification-controller,image-reflector-controller,image-automation-controller --export > deploy/bases/flux.yaml

# This regenerates the istio manifests while using yq to remove the CRD for the
# operator so it doesn't clash with the istio operator which also includes the
# CRD
.PHONY: update-istio
update-istio:
		istioctl manifest generate --dry-run | yq 'select(.metadata.name != "istiooperators.install.istio.io" or .kind != "CustomResourceDefinition") | select (.!=null)' > platform/components/istio/istio-manifests.yaml

# This regenerates the istio operator manifests, which include the IstioOperator
# CRD that we omitted above
.PHONY: update-istio-operator
update-istio-operator:
		istioctl operator dump --dry-run > platform/components/istio/operator.yaml

.PHONY: print-arango-deployment
print-arango-deployment:
		kustomize build app/$(env) | yq -y '. | select(.kind == "ArangoDeployment" and .metadata.name == "arangodb")'

.PHONY: print-istio-operator
print-istio-operator:
		kustomize build platform/$(env) | yq -y '. | select(.kind == "IstioOperator" and .metadata.name == "istio-controlplane")'

.PHONY: platform
platform:
		kustomize build platform/$(env) | kubectl apply -f -

.PHONY: deploy
deploy:
ifeq ("$(env)", "gke")
		kustomize build deploy/creds/readwrite | kubectl apply -f -
		kustomize build deploy/$(env) | kubectl apply -f -
else
		kustomize build deploy/$(env) | kubectl apply -f -
endif

.PHONY: app
app:
		kubectl apply -k k8s/overlays/$(env)

.PHONY: scan
scan:
		kubectl delete job domain-dispatcher-manual -n scanners --ignore-not-found &&
		kubectl create job domain-dispatcher-manual --from=cronjob/domain-dispatcher -n scanners

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

.PHONY: reports
reports:
		kubectl delete job dmarc-report-manual -n scanners --ignore-not-found &&
		kubectl create job dmarc-report-manual --from=cronjob/dmarc-report -n scanners

.ONESHELL:
.PHONY: credentials
credentials:
		@cat <<-'EOF' > k8s/apps/bases/scanners/scanner-platform/creds/scanners.env
		DB_PASS=test
		DB_HOST=arangodb.db
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
		GITHUB_BRANCH=master
		GITHUB_FILE=dmarc-domains.json
		GITHUB_OWNER=cybercentrecanada
		GITHUB_REPO=dmarc-tbs-domains
		GITHUB_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
		GITHUB_URL=https://api.github.com/graphql
		AZURE_CONN_STRING=???
		DATABASE=tbs-tracker
		SUMMARIES_CONTAINER=tbs-tracker-summaries
		EOF
		cat <<-'EOF' > k8s/apps/bases/api/creds/api.env
		DB_PASS=test
		DB_URL=http://arangodb.db:8529
		DB_NAME=track_dmarc
		AUTHENTICATED_KEY=alonghash
		REFRESH_KEY=alonghash
		SIGN_IN_KEY=alonghash
		AUTH_TOKEN_EXPIRY=60
		REFRESH_TOKEN_EXPIRY=7
		CIPHER_KEY=1234averyveryveryveryverylongkey
		LOGIN_REQUIRED=true
		NOTIFICATION_API_KEY=test_key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
		NOTIFICATION_API_URL=https://api.notification.alpha.canada.ca
		DMARC_REPORT_API_SECRET=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		TOKEN_HASH=somelonghash
		DMARC_REPORT_API_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		DMARC_REPORT_API_URL=http://localhost:4001/graphql
		DEPTH_LIMIT=15
		COST_LIMIT=75000
		SCALAR_COST=1
		OBJECT_COST=1
		LIST_FACTOR=1
		DNS_SCANNER_ENDPOINT=http://ots-scan-queue.scanners.svc.cluster.local/dns
		HTTPS_SCANNER_ENDPOINT=http://ots-scan-queue.scanners.svc.cluster.local/https
		SSL_SCANNER_ENDPOINT=http://ots-scan-queue.scanners.svc.cluster.local/ssl
		NOTIFICATION_AUTHENTICATE_EMAIL_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_AUTHENTICATE_TEXT_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_EN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_FR=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_ORG_INVITE_EN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_ORG_INVITE_FR=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_PASSWORD_RESET_EN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_PASSWORD_RESET_FR=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_TWO_FACTOR_CODE_EN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_TWO_FACTOR_CODE_FR=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_VERIFICATION_EMAIL_EN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		NOTIFICATION_VERIFICATION_EMAIL_FR=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
		REDIS_PORT_NUMBER=6379
		REDIS_DOMAIN_NAME=redis-service.scanners
		DKIM_SCAN_CHANNEL=scan/dkim
		DMARC_SCAN_CHANNEL=scan/dmarc
		HTTPS_SCAN_CHANNEL=scan/https
		SPF_SCAN_CHANNEL=scan/spf
		SSL_SCAN_CHANNEL=scan/ssl
		TRACING_ENABLED=false
		HASHING_SALT=somerandomvalue
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

#################################################################################
# GLOBALS                                                                       #
#################################################################################

project = track-compliance
name = test
region = northamerica-northeast1
mode = dev
env = test
displayname="admin"
SA_USER_USERNAME="admin@example.com""
SA_USER_PASSWORD="admin"

define scanners =
endef

.PHONY: cluster
cluster:
		gcloud beta container --project "$(project)" clusters create "$(name)" --region "$(region)" --no-enable-basic-auth --release-channel "regular" --machine-type "e2-highcpu-4" --image-type "COS_CONTAINERD" --disk-type "pd-standard" --disk-size "50" --metadata disable-legacy-endpoints=true --service-account "gke-node-service-account@track-compliance.iam.gserviceaccount.com" --num-nodes "2" --enable-stackdriver-kubernetes --enable-ip-alias --network "projects/track-compliance/global/networks/default" --subnetwork "projects/track-compliance/regions/northamerica-northeast1/subnetworks/default" --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing,CloudRun --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0 --workload-pool "track-compliance.svc.id.goog" --enable-shielded-nodes --shielded-secure-boot --enable-dataplane-v2

.PHONY: secrets
secrets:
ifeq ("$(env)", "gke")
		kustomize build platform/creds/prod | kubectl apply -f -
		kustomize build app/creds/prod | kubectl apply -f -
else
		kustomize build platform/creds/dev/ | kubectl apply -f -
		kustomize build app/creds/dev | kubectl apply -f -
endif

.PHONY: backup
backup:
		arangodump --include-system-collections true --server.database track_dmarc --output-directory $(to)

.PHONY: restore
restore:
		arangorestore --server.database track_dmarc --create-collection false --include-system-collections true --input-directory $(from)

.PHONY: update-flux
update-flux:
		flux install --components=source-controller,kustomize-controller,notification-controller,image-reflector-controller,image-automation-controller --export > deploy/bases/flux.yaml

.PHONY: update-istio
update-istio:
		istioctl manifest generate --set meshConfig.accessLogFile=/dev/stdout --set meshConfig.accessLogEncoding=JSON --set tag=1.9.5-distroless --set values.pilot.traceSampling=100.00 > platform/components/istio/istio.yaml

.PHONY: print-ingress
print-ingress:
		kustomize build platform/$(env) | yq -y '. | select(.kind == "Service" and .metadata.name == "istio-ingressgateway")'

.PHONY: print-arango-deployment
print-arango-deployment:
		kustomize build app/$(env) | yq -y '. | select(.kind == "ArangoDeployment" and .metadata.name == "arangodb")'

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
		kustomize build app/$(env) | kubectl apply -f -

.PHONY: scans
scans:
		kubectl apply -n scanners -f app/jobs/scan-job.yaml
		kubectl apply -n scanners -f app/jobs/core-job.yaml

.PHONY: superadmin
superadmin:
		kubectl apply -f app/jobs/super-admin.yaml

.ONESHELL:
.PHONY: credentials
credentials:
		@cat <<-'EOF' > app/creds/$(mode)/scanners.env
		DB_PASS=test
		DB_HOST=arangodb.db
		DB_USER=root
		DB_NAME=track_dmarc
		GITHUB_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
		REDIS_HOST=10.108.20.222
		REDIS_PORT=6379
		EOF
		cat <<-'EOF' > platform/creds/$(mode)/kiali.env
		username=admin
		passphrase=admin
		EOF
		cat <<-'EOF' > app/creds/$(mode)/arangodb.env
		username=root
		password=test
		EOF
		cat <<-'EOF' > app/creds/$(mode)/dmarc.env
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
		cat <<-'EOF' > app/creds/$(mode)/api.env
		DB_PASS=test
		DB_URL=http://arangodb.db:8529
		DB_NAME=track_dmarc
		AUTHENTICATED_KEY=alonghash
		SIGN_IN_KEY=alonghash
		CIPHER_KEY=1234averyveryveryveryverylongkey
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
		DNS_SCANNER_ENDPOINT=dns.scanners
		HTTPS_SCANNER_ENDPOINT=https.scanners
		SSL_SCANNER_ENDPOINT=ssl.scanners
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
		REDIS_DOMAIN_NAME=10.108.20.222
		DKIM_SCAN_CHANNEL=scan/dkim
		DMARC_SCAN_CHANNEL=scan/dmarc
		HTTPS_SCAN_CHANNEL=scan/https
		SPF_SCAN_CHANNEL=scan/spf
		SSL_SCAN_CHANNEL=scan/ssl
		TRACING_ENABLED=true
		EOF
		cat <<-'EOF' > app/creds/$(mode)/superadmin.env
		DB_PASS=test
		DB_URL=arangodb.db:8529
		DB_NAME=track_dmarc
		SA_USER_DISPLAY_NAME="$(displayname)"
		SA_USER_USERNAME="$(username)"
		SA_USER_PASSWORD="$(password)"
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
		echo "Credentials written to app/creds/$(mode)"

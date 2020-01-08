.ONESHELL:
SHELL=bash
setup:
	python -m venv .env
	pip install -e .[development]
	pip install -e .
	pip install -r domain-scan/requirements.txt
	pip install -r domain-scan/requirements-scanners.txt
	if [ ! -d csv ]; then mkdir csv; fi
	cat > ./csv/owners.csv <<- EOF
	domain,filler,organization_en,organization_fr
	canada.ca,,Employment and Social Development Canada,Famille,Enfants et Développement social
	digital.canada.ca,,Treasury Board of Canada Secretariat,Secrétariat du Conseil du Trésor du Canada
	numerique.canada.ca,,Treasury Board of Canada Secretariat,Secrétariat du Conseil du Trésor du Canada
	EOF
	cat > ./csv/domains.csv <<- EOF
	domain
	canada.ca
	consultations-edsc.canada.ca
	digital.canada.ca
	numerique.canada.ca
	census.gc.ca
	EOF
	cat > ./csv/ciphers.csv <<- EOF
	cipher
	TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
	TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
	TLS_ECDHE_ECDSA_WITH_AES_128_CCM
	TLS_ECDHE_ECDSA_WITH_AES_256_CCM
	TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256
	TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384
	TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA
	TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA
	TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
	TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
	TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256
	TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384
	TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
	TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA
	TLS_DHE_RSA_WITH_AES_128_GCM_SHA256
	TLS_DHE_DSS_WITH_AES_128_GCM_SHA256
	TLS_DHE_RSA_WITH_AES_256_GCM_SHA384
	TLS_DHE_DSS_WITH_AES_256_GCM_SHA384
	TLS_DHE_RSA_WITH_AES_128_CCM
	TLS_DHE_RSA_WITH_AES_256_CCM
	TLS_DHE_DSS_WITH_AES_128_CBC_SHA256
	TLS_DHE_RSA_WITH_AES_128_CBC_SHA256
	TLS_DHE_DSS_WITH_AES_256_CBC_SHA256
	TLS_DHE_RSA_WITH_AES_256_CBC_SHA256
	TLS_DHE_DSS_WITH_AES_128_CBC_SHA
	TLS_DHE_RSA_WITH_AES_128_CBC_SHA
	TLS_DHE_DSS_WITH_AES_256_CBC_SHA
	TLS_DHE_RSA_WITH_AES_256_CBC_SHA
	TLS_RSA_WITH_AES_128_GCM_SHA256
	TLS_RSA_WITH_AES_256_GCM_SHA384
	TLS_RSA_WITH_AES_128_CCM
	TLS_RSA_WITH_AES_256_CCM
	TLS_RSA_WITH_AES_128_CBC_SHA256
	TLS_RSA_WITH_AES_256_CBC_SHA256
	TLS_RSA_WITH_AES_128_CBC_SHA
	TLS_RSA_WITH_AES_256_CBC_SHA
	EOF


scan:
	. .env/bin/activate
	tracker run
# Production data update process:
#
# Run a fresh scan, update the database, and upload data to S3.
# Enable Lambda mode, using Lambda AWS profile set up in production.
update_production:
	tracker run --lambda --lambda-profile lambda

# Development data update process:
#
# Don't scan or download latest data (rely on local cache), update database.
update_development:
	. .env/bin/activate
	tracker process

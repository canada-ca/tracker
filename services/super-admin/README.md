# Super Admin Service

The purpose of this service is to provide an initContainer to the API, and create a default super admin account if need be.

## Install dependencies

Like all other JavaScript applications, dependencies are installed with npm.

```bash
npm i
```

## One time setup

This application uses the [dotenv-safe](https://github.com/rolodato/dotenv-safe) library to enforce that the environment variables it is counting on actually exist. This makes the application fail immediately with a descriptive error if anything important is missing.

To set up the environment, duplicate the `.env.example` file and fill in the values. Example values are shown.

```bash
cp .env.example .env
cat .env
DB_PASS=test
DB_URL=http://localhost:8529
DB_NAME=track_dmarc
SA_USER_DISPLAY_NAME=<your super admin display name>
SA_USER_USERNAME=<your super admin email address>
SA_USER_PASSWORD=<your super admin password, will be hashed by service>
SA_USER_LANG=<your super admin preferred language>
SA_ORG_EN_SLUG=<your super admin orgs english translation slug>
SA_ORG_EN_ACRONYM=<your super admin orgs english translation acronym>
SA_ORG_EN_NAME=<your super admin orgs english translation name>
SA_ORG_EN_ZONE=<your super admin orgs english translation zone>
SA_ORG_EN_SECTOR=<your super admin orgs english translation sector>
SA_ORG_EN_COUNTRY=<your super admin orgs english translation country>
SA_ORG_EN_PROVINCE=<your super admin orgs english translation province>
SA_ORG_EN_CITY=<your super admin orgs english translation city>
SA_ORG_FR_SLUG=<your super admin orgs french translation slug>
SA_ORG_FR_ACRONYM=<your super admin orgs french translation acronym>
SA_ORG_FR_NAME=<your super admin orgs french translation name>
SA_ORG_FR_ZONE=<your super admin orgs french translation zone>
SA_ORG_FR_SECTOR=<your super admin orgs french translation sector>
SA_ORG_FR_COUNTRY=<your super admin orgs french translation country>
SA_ORG_FR_PROVINCE=<your super admin orgs french translation province>
SA_ORG_FR_CITY=<your super admin orgs french translation city>
```

## Testing

### Local development

The tests require a copy of [ArangoDB](https://www.arangodb.com/) to be running locally. ArangoDB should have its own .env file, and the value of the root password should align with the value of `DB_PASS` in the services `.env` file.

```bash
# Write the arango test credentials into an env file:
echo ARANGO_ROOT_PASSWORD=test > arangodb.env
# Run a detached arangodb container using the root password from the env:
docker run -d -p=8529:8529 --env-file arangodb.env --name=arango arangodb
# Run the tests:
npm test
```

With ArangoDB running you will need to create a `test.env` file, with values to be used during the test run.

```
[mike@ouroboros super-admin]$ cat test.env
DB_PASS=test
DB_URL=http://localhost:8529
DB_NAME=track_dmarc
SA_USER_DISPLAY_NAME=mike
SA_USER_USERNAME=mike@korora.ca
SA_USER_PASSWORD=test
SA_USER_LANG=en
SA_ORG_EN_SLUG=sa
SA_ORG_EN_ACRONYM=SA
SA_ORG_EN_NAME=Super Admin
SA_ORG_EN_ZONE=FED
SA_ORG_EN_SECTOR=TBS
SA_ORG_EN_COUNTRY=Canadana
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
```

### Cloudbuild

Cloudbuild is used for CI, and one of the reasons for that is that it has great tooling for running jobs locally which is very helpful for debugging. To see how this will behave in CI you can run something like the following to run the tests with cloud-build-local.

```bash
cloud-build-local --config cloudbuild.yaml --substitutions=BRANCH_NAME=foo,SHORT_SHA=asdf1234,_DB_PASS=test,_DB_URL=http://arangodb:8529,_DB_NAME=track_dmarc,_SA_ORG_EN_ACRONYM=SA,_SA_ORG_EN_CITY=city,_SA_ORG_EN_COUNTRY=country,_SA_ORG_EN_NAME=name,_SA_ORG_EN_PROVINCE=province,
_SA_ORG_EN_SECTOR=sector,_SA_ORG_EN_SLUG=slug,_SA_ORG_EN_ZONE=zone,_SA_ORG_FR_ACRONYM=SA,_SA_ORG_FR_CITY=city,_SA_ORG_FR_COUNTRY=country,
_SA_ORG_FR_NAME=name,_SA_ORG_FR_PROVINCE=province,_SA_ORG_FR_SECTOR=sector,_SA_ORG_FR_SLUG=slug,_SA_ORG_FR_ZONE=zone,
_SA_USER_DISPLAY_NAME=display-name,_SA_USER_LANG=english,_SA_USER_PASSWORD=password,_SA_USER_USERNAME=test@email.ca --dryrun=false .
```
Because of the way the cloudbuild config spins up and detaches a copy of ArangoDB, you will need to run the following commands to clean up after.
```bash
docker stop $(docker ps -q)
docker rm arangodb
```

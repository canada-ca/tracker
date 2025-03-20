# Domain Ownership

The purpose of this service is to get a domain ownership list from a GitHub repository available via an API.

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
GITHUB_TOKEN=<your github token>
GITHUB_URL=https://api.github.com/graphql
GITHUB_BRANCH=<your github branch file is located in>
GITHUB_FILE=<your github file containing domain ownership info>
GITHUB_OWNER=<your github repo owner>
GITHUB_REPO=<your github repo the file is located in>
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

### Cloudbuild

Cloudbuild is used for CI, and one of the reasons for that is that it has great tooling for running jobs locally which is very helpful for debugging. To see how this will behave in CI you can run something like the following to run the tests with cloud-build-local.

```bash
cloud-build-local --config cloudbuild.yaml --substitutions=_DB_PASS=test,_DB_URL=http://arangodb:8529,_DB_NAME=track_dmarc,_GITHUB_URL=https://api.github.com/graphql,_GITHUB_TOKEN=12345,BRANCH_NAME=foo,SHORT_SHA=asdf1234 --dryrun=false .
```
Because of the way the cloudbuild config spins up and detaches a copy of ArangoDB, you will need to run the following commands to clean up after.
```bash
docker stop $(docker ps -q)
docker rm arangodb
```

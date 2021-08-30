# Results Processing

The purpose of this service is to use the scan results to create guidance tags, and use those tags to determine a general pass/fail for the domain summaries. (certificates, ciphers, curves, dkim, dmarc, hsts, https, policy, protocols, spf, ssl)

## Install dependencies

Dependencies are installed using pipenv, or pip. pipenv controls python environments and uses lock files, it is the recommended process.

```bash
pipenv install
```

To use the created environment, enter the shell and use python as normal from within it.

```bash
pipenv shell
```

Pip uses the requirement.txt to install the dependencies.

```bash
pip install -r requirements.txt
```

## Testing

### Local development

The tests require a copy of [ArangoDB](https://www.arangodb.com/) to be running locally. ArangoDB should have it's own .env file, and the value of the root password should align with the value of `DB_PASS` in the services `.env` file.

```bash
# Write the arango test credentials into an env file:
echo ARANGO_ROOT_PASSWORD=test > arangodb.env
# Run a detached arangodb container using the root password from the env:
docker run -d -p=8529:8529 --env-file arangodb.env --name=arango arangodb
# Run the tests: (when using pipenv, make sure you are in the shell)
pytest
```

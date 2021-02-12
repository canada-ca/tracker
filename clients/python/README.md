# Tracker Python API Client

The Tracker Python API Client will provide a Python wrapper for key features of Tracker. 

It makes use of [gql](https://github.com/graphql-python/gql), a Python GraphQL client, to query the Tracker API.

#### Installing Dependencies

Install [pipenv](https://pypi.org/project/pipenv/) if you don't already have it.

```shell
pipenv install --dev
```

If you run into issues, ensure pipenv has installed the most recent GQL version. The most recent version of GQL is only available from their Github, so if you need to install it manually run:

```shell
pipenv install -e git+https://github.com/graphql-python/gql.git#egg=gql
```

#### Authentication

The client will attempt to draw credentials from its environment in order to obtain an authentication token. Pipenv makes this easy to set up by importing environment variables from a `.env` file present in this directory whenever `pipenv run` or `pipenv shell` are used. The `.env` file can be created like so:

```bash
cat <<'EOF' > .env
TRACKER_UNAME=YOURTRACKEREMAILHERE@EXAMPLE.COM
TRACKER_PASS=YOURPASSWORDHERE
EOF
```

#### Testing

Pytest is used for testing. To run tests, run the following in the project root (the folder containing this README.md):

```shell
pipenv run pytest
```

Alternatively, if you are already in a pipenv shell, just run `pytest`.

If tests are failing with ModuleNotFoundError, make sure tracker_client/ is on your PYTHONPATH. The .env file used to store your credentials is a good way to set this.

#### Note about IPython/Jupyter 

Because of a limitation in gql, the client is not currently compatible with IPython or Jupyter.

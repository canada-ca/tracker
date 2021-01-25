# Tracker Python API Client

The Tracker Python API Client will provide a Python wrapper for key features of Tracker. 

It makes use of [GQL](https://github.com/graphql-python/gql), a Python GraphQL client, to query the Tracker API.

#### Installing Dependencies

Install [pipenv](https://pypi.org/project/pipenv/) if you don't already have it.

```shell
pipenv install --dev
```

If you run into issues, ensure pipenv has installed the most recent GQL version. The most recent version of GQL is only available from their Github, so if you need to install it manually run:

```shell
pipenv install -e git+https://github.com/graphql-python/gql.git#egg=gql
```


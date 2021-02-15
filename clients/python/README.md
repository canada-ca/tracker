# Tracker Python API Client

The Tracker Python API Client provides a simple Python interface for the [Tracker GraphQL API](https://github.com/canada-ca/tracker/blob/master/api-js/README.md), with the aim of allowing users to easily integrate data from Tracker into existing workflows and platforms. It allows access to the JSON data served by the API without requiring specific knowledge of [GraphQL](https://graphql.org/) or the Tracker API. This is done by providing functions that execute canned queries against the API using [gql](https://github.com/graphql-python/gql). Responses are formatted to remove pagination related structures, and to ensure useful keys are always present.


## Installation

### For Users

The client will soon be available to install as a package via pip or pipenv. Until then, follow the instructions for developers below.

### For Developers

Install [pipenv](https://pypi.org/project/pipenv/) if you don't already have it. The following instructions assume you are using pipenv.

#### Installing Dependencies 

Make sure you have pulled the most recent version from the repo, then run:

```shell
pipenv install --dev
```

If you run into issues, ensure pipenv has installed the most recent GQL version. The most recent version of GQL is only available from their Github, so if you need to install it manually run:

```shell
pipenv install -e git+https://github.com/graphql-python/gql.git#egg=gql
```

## Usage


### Authentication

You must have a Tracker account that is a member of one or more organizations to make use of the Python client. You can manage your account in the [Tracker web interface](https://tracker.alpha.canada.ca/).

The client will attempt to draw credentials from its environment in order to obtain an authentication token. Pipenv makes this easy to set up by importing environment variables from a `.env` file present in this directory whenever `pipenv run` or `pipenv shell` are used. The `.env` file can be created like so:

```bash
cat <<'EOF' > .env
TRACKER_UNAME=YOURTRACKEREMAILHERE@EXAMPLE.COM
TRACKER_PASS=YOURPASSWORDHERE
EOF
```

You should be mindful that setting these variables manually can result in credentials being stored in your shell command history.

### Basic Usage

You will generally start by creating a client with `create_client(auth_token=get_auth_token())` and storing the result. All functions that make queries expect such a client to be passed as the first argument.

### Examples

#### Get all domains in my organizations
Supposing I belong to two organizations with the acronyms "FOO" and "BAR":

```python
>>> from tracker_client import client
>>> client = create_client(auth_token=get_auth_token())
>>> get_all_domains(client)
{
    "FOO": [
        "foo.bar",
        "foo.bar.baz"
    ],
    "BAR": [
        "fizz.buzz",
        "buzz.bang",
        "ab.cd.ef",
    ]
}
```

The following examples continue the previous one (assume the package has been imported and a `client` object with a valid token exists).

#### Get a DMARC summary for a domain

```python
>>> get_dmarc_summary(client, "foo.bar", "september", 2020)
{
    "foo.bar": {
        "month": "SEPTEMBER",
        "year": "2020",
        "categoryPercentages": {
            "fullPassPercentage": 87,
            "passSpfOnlyPercentage": 0,
            "passDkimOnlyPercentage": 6,
            "failPercentage": 8,
            "totalMessages": 10534
        }
    }
}
```

#### Get summary metrics for an organization

```python
>>> get_summary_by_acronym(client, "foo")
{
    "FOO": {
        "domainCount": 10,
        "summaries": {
            "web": {
                "total": 10,
                "categories": [
                    {
                        "name": "pass",
                        "count": 1,
                        "percentage": 10
                    },
                    {
                        "name": "fail",
                        "count": 9,
                        "percentage": 90
                    }
                ]
            },
            "mail": {
                "total": 10,
                "categories": [
                    {
                        "name": "pass",
                        "count": 5,
                        "percentage": 50
                    },
                    {
                        "name": "fail",
                        "count": 5,
                        "percentage": 50
                    }
                ]
            }
        }
    }
}
```

#### Get the status of a domain 

```python
>>> get_domain_status(client, "foo.bar")
Getting domain status for cse-cst.gc.ca...
{
    "foo.bar": {
        "lastRan": "2021-01-23 22:33:26.921529",
        "status": {
            "https": "FAIL",
            "ssl": "FAIL",
            "dmarc": "PASS",
            "dkim": "PASS",
            "spf": "PASS"
        }
    }
}
```

> **NOTE**: Because of gql limitations, the client is not currently compatible with IPython or Jupyter.

## Development

### Testing

Pytest is used for testing. To run tests, run the following in the project root (the folder containing this README.md):

```shell
pipenv run pytest
```

Alternatively, if you are already in a pipenv shell, just run `pytest`.

If tests are failing with ModuleNotFoundError, make sure tracker_client/ is on your PYTHONPATH. The .env file used to store your credentials is a good way to set this.

When additions or significant changes are made, check test coverage with:

```shell
pipenv run pytest --cov=tracker_client
```


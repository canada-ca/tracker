# Tracker Python API Client

The Tracker Python API Client provides a simple Python interface for the [Tracker GraphQL API](https://github.com/canada-ca/tracker/blob/master/api/README.md), with the aim of allowing users to easily integrate data from Tracker into existing workflows and platforms. It allows access to the JSON data served by the API without requiring specific knowledge of [GraphQL](https://graphql.org/) or the Tracker API. This is done by providing an object-oriented interface to execute canned queries against the API using [gql](https://github.com/graphql-python/gql). Responses are formatted to remove pagination related structures, and to ensure useful keys are always present.


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

Start by importing the `Client` class (see below for examples). Instantiating `Client` will connect to Tracker and authenticate with your credentials, at which point you can begin getting `Domain` and `Organization` objects using that `Client` instance's methods. You can then operate on these objects to get the data you need from Tracker.

### Examples

#### See all of your domains

Note the use of a list comprehension inside the call to `print`. Calling `print` on a container uses contained objects' `__repr__` rather than `__str__`, so the list comprehension simply serves to make the output more human-friendly.

```python
>>> from tracker_client.client import Client
>>> client = Client()
>>> domain_list = client.get_domains()
>>> print([str(domain) for domain in domain_list])
["foo.bar", "foo.bar.baz", "fizz.buzz", "buzz.bang", "ab.cd.ef"]
```

The following examples assume the package has been imported as above and a `Client` has been instantiated as client.

#### Get a DMARC summary for a specific domain

```python
>>> foobar = client.get_domain("foo.bar")
>>> print(foobar.get_dmarc_summary("september", 2020))
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

#### Get summary metrics for a specific organization

```python
>>> foo = client.get_organization("Foo Bar")
>>> print(foo.get_summary())
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
>>> foobar = client.get_domain("foo.bar")
>>> print(foobar.get_domain_status())
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

#### Get a list of all domains not properly implementing DMARC

Supposing all your domains, except "foo.bar", properly implement DMARC:

```python
>>> import json
>>> client = Client()
>>> domain_list = client.get_domains()
>>> dmarc_fails = []
>>> for domain in domain_list:
...     status = json.loads(domain.get_status())
...     if status[domain.domain_name]["status"]["dmarc"] == "FAIL":
...         dmarc_fails.append(domain.domain_name)
...
>>> print(dmarc_fails)
["foo.bar"]
```

> **NOTE**: Because of gql limitations, the client is not currently compatible with IPython or Jupyter.

## Development

### Build Docs

The client comes with documentation generated by [Sphinx](https://www.sphinx-doc.org/en/3.x/index.html) from the docstrings in the source code. Because of this, they are not included in the GitHub repo. To build the docs you will first need to install Sphinx. 

The simplest way to ensure you have Sphinx installed is to install the client's dev dependencies with pipenv:

```bash
pipenv install --dev
```

If you don't wish to use pipenv, see the Sphinx [installation instructions.](https://www.sphinx-doc.org/en/3.x/usage/installation.html)

Once Sphinx is installed, navigate to the `/docs` directory located in the Python client project root and run:

```bash
pipenv run make html
```

Or if you installed Sphinx outside pipenv, just run `make html`.

You will find the built docs in `/build/html` within the docs directory. Sphinx can also build to other formats! See [here](https://www.sphinx-doc.org/en/master/man/sphinx-build.html) for the available options.


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


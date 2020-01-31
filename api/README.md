# API
Our API is built on [Flask](https://www.palletsprojects.com/p/flask/), and [GraphQL](https://graphql.org/).
We have chosen these technologies to provide an example for the Government of Canada with the use of a GraphQL
API rather than the traditional REST API.

### Installing Dependencies
Run pipenv installer in api directory

```pipenv install```

### Running the API
To run the API run the following command

```pipenv run server```

### Accessing the API
Visit the following URL localhost:5000/graphql

### Running tests locally
To run test locally run 
```cloud-build-local --config=api/cloudbuild.yaml --substitutions=BRANCH_NAME=<branch name>,SHORT_SHA=<commit hash>,_DB_HOST=postgres,_DB_NAME=auth,_DB_PASS=postgres,_DB_PORT=5432,_DB_USER=postgres --dryrun=false .```
from the root directory of the repository.

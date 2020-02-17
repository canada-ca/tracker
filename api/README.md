# API
Our API is built on [Flask](https://www.palletsprojects.com/p/flask/), and [GraphQL](https://graphql.org/).
We have chosen these technologies to provide an example for the Government of Canada with the use of a GraphQL
API rather than the traditional REST API.

### Installing Dependencies
Run pipenv installer in api directory
```
pipenv install
```

### Setting Up Database
To setup the initial postgres database tables run the following commands

```
pipenv run db-init
pipenv run db-migrate
pipenv run db-upgrade
```
##### Database Changes
If any modifications are done to the models.py file, to reflect those changes
in the data base run the following commands
```
pipenv run db-migrate
pipenv run db-upgrade
```

#### Seeding Data into Database
If you have any data setup for insert in the ```api/functions/db_seeding``` files run the following commands
```
pipenv run db-seed
```

#### Removing Seeded Data from Database
If you have inserted any data using the seed command, you can remove it from the database using the following command
```
pipenv run db-remove-seed
```
### Running the API
To run the API run the following command
```
pipenv run server
```

### Accessing the API
Visit the following URL localhost:5000/graphql


### Running tests locally
To run test locally run 
```
cloud-build-local --config=api/cloudbuild.yaml --substitutions=BRANCH_NAME=<branch name>,SHORT_SHA=<commit hash>,_DB_HOST=postgres,_DB_NAME=track-dmarc,_DB_PASS=postgres,_DB_PORT=5432,_DB_USER=postgres --dryrun=false .
```
from the root directory of the repository.

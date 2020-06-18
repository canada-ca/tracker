# API
Our API is built on [Flask](https://www.palletsprojects.com/p/flask/), and [GraphQL](https://graphql.org/).
We have chosen these technologies to provide an example for the Government of Canada with the use of a GraphQL
API rather than the traditional REST API.

### Installing Dependencies
Run pipenv installer in the api directory.
```shell script
pipenv sync --bare
```

### Setting Up Database
To setup the initial postgres database tables run the following commands:
```shell script
pipenv run db-init
pipenv run db-migrate
pipenv run db-upgrade
```
##### Database Updates
If any modifications are done to the models.py file, to reflect those changes in the data base run the following commands:
```shell script
pipenv run db-migrate
pipenv run db-upgrade
```
##### Database Rollbacks
If you need to revert any changes that you have made using the `db-upgrade` command,
you can run the following command to rollback the database to the previous version:
```shell script
pipenv run db-downgrade
```
#### Database Update Errors
##### Column Type Changes
When changing column types a `sqlalchemy.exc.ProgrammingError` may occur and require you to change the generated 
`op.alter_column()` to a `op.execute()` and write out an PSQL statement inside.

##### Foreign Key Relationships
When creating a foreign key, flask-migrate does not create a name for the constraint and an error may occur during
a database downgrade. To correct this error, find the latest version file in `migrations/versions/` and set the
first argument of `op.create_foreign_key()` and `op.drop_constraint()`.

#### Seeding Data into Database
If you have any data setup for insert in the ```api/functions/db_seeding``` files run the following commands.
```shell script
pipenv run db-seed
```

#### Removing Seeded Data from Database
If you have inserted any data using the seed command, you can remove it from the database using the following command:
```shell script
pipenv run db-remove-seed
```
### Running the API
To run the API run the following command:
```shell script
pipenv run server
```

### Accessing the API
Visit the following URL:  `localhost:5000/graphql`

### Dev Workflow
#### Installing Dev Dependencies
To work in a dev environment it is important to install the dev dependencies as well as
the base dependencies.
```shell script
pipenv sync -d --bare
```

#### Running tests locally
To run tests locally, run:
```shell script
cloud-build-local --config=api/cloudbuild.yaml --substitutions=BRANCH_NAME=<branch name>,SHORT_SHA=<commit hash>,_DB_HOST=postgres,_DB_NAME=track-dmarc,_DB_PASS=postgres,_DB_PORT=5432,_DB_USER=postgres --dryrun=false .
```
from the root directory of the repository.

#### Installing Black
Keeping with code formatting standards this project uses [black](https://github.com/psf/black). To install black
follow the instructions below. Due to the lack of a stable release for the black module, it is impossible to add to our dev dependencies as we would have to use the `--pre` tag which causes issues with our base dependencies. Thus, we have to install it globally.
```shell script
pip install black
```

#### Setting up pre-commit
`pre-commit` is a part of the dev dependencies, so it will already be installed in your
virtual environment. However, as this is a monorepo setup you will have to navigate
back to the route directory of this project.
```shell script
From API directory
cd ../
pre-commit install
```

An example .pre-commit.yaml file is as follows:
```
repos:
-   repo: https://github.com/ambv/black
    rev: stable
    hooks:
    - id: black
      language_version: python3.8
```

Because of the monorepo setup we will also have to modify pre-commit to navigate to the 
api directory to grab the `pre-commit-config.yaml` file.
```shell script
cd ./git/hooks
nano pre-commit
```
On line 21, modify the following:
```python
ARGS = ['hook-impl', '--config=.pre-commit-config-yaml', '--hook-type=pre-commit']
```
To
```python
ARGS = ['hook-impl', '--config=api/.pre-commit-config-yaml', '--hook-type=pre-commit']
```
Now whenever a commit is run, black will be ran on the files that have been added to
that commit. This ensures the consistency of code format.

Note: Before committing changes, run ```black .``` to ensure that all files have been run through black. Otherwise, the commit will fail until all files are meet with black standards. [(Background)](https://github.com/pre-commit/pre-commit/issues/747)

# API
Our API is built on [Flask](https://www.palletsprojects.com/p/flask/), and [GraphQL](https://graphql.org/).
We have chosen these technologies to provide an example for the Government of Canada with the use of a GraphQL
API rather than the traditional REST API.

### Installing Dependencies
Run pipenv installer in api directory

```pipenv install```

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
### Running the API
To run the API run the following command

```pipenv run server```

### Accessing the API
Visit the following URL localhost:5000/graphql

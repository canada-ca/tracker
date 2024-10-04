# Update-Selectors Service

## Overview
The `update-selectors` service is a Python-based service designed to synchronize selectors between ArangoDB and CosmosDB. The service supports periodical updates and has an optional feature to remove selector edges older than one year.

## Features
* Synchronizes selectors from CosmosDB to ArangoDB.
* Optional removal of selector edges that are older than 1 year controlled by the `REMOVE_SELECTORS` flag.

## Install dependencies
```
pip3 install -r requirements.txt
```

## Testing
Run test database for ArangoDB and CosmosDB using the docker-compose file in the /tests directory:
```
cd tests
docker-compose up -d
```

Then run pytest from the root directory:

```
python3 -m pytest
```

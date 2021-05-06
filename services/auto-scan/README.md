# Auto-Scan Service

This directory contains a Python script and Dockerfile that make up Tracker's Auto-scan service.

The purpose of this script is to orchestrate the scanning of all domains monitored by Tracker. The container built from the contents of this folder is run as a CronJob on our Kubernetes deployment so that scans are performed regularly. The manifest for this resource can be found [here](https://github.com/canada-ca/tracker/tree/master/app/bases/knative/config/autoscan.yaml).

If you need to run scans outside of the regularly scheduled intervals, check [here.](https://github.com/canada-ca/tracker/tree/master/app/jobs)

## Installing Dependencies

To install dependencies, you can use pip or pipenv. Pipenv is recommended for development.

To install with pip:
```bash
pip3 install -r requirements.txt
```

With pipenv:
```
pipenv install
```
Pipenv will pick up requirements.txt automatically so long as it doesn't find a pipfile. 

## Environment

The script expects to find the following environment variables:

```bash
DB_USER=your_db_username
DB_PASS=your_db_password
DB_PORT=db_port_to_connect_to
DB_NAME=name_of_db_to_connect_to
DB_HOST=db_host_name
```

It also looks for `QUEUE_URL` but has a sane default value if not provided.
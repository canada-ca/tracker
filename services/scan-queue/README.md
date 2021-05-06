# Scan Queue

This directory contains the Python source and Docker file for Tracker's scan queue, a [Flask](https://palletsprojects.com/p/flask/) app that runs on a [Gunicorn](https://gunicorn.org/) server and is deployed as a [Knative](https://knative.dev/) service.

The scan queue receives scan requests, typically from the [auto-scan service](https://github.com/canada-ca/tracker/tree/master/services/auto-scan), and enqueues them in one of three [Redis](https://redis.io/) [queues](https://python-rq.org/) depending on the scan type. Workers then asynchronously dispatch requests to the appropriate scanners. The `docker-entrypoint.sh` script is responsible for starting the Redis server and RQ workers prior to launching the Flask app and its Gunicorn server, as they must be running in the background for the queue to function.

The manifest defining the Knative service can be found [here.](https://github.com/canada-ca/tracker/blob/master/app/bases/knative/config/queues.yaml)

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

The queue expects to find the following environment variables:

```bash
HTTPS_URL=https_scanner_url
SSL_URL=ssl_scanner_url
DNS_URL=dns_scanner_url
```

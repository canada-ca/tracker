# Tracker

This project tracks Government of Canada domains for adherence to digital security best practices and federal requirements.

## Repo Structure

This project is organized in the [monorepo](https://en.wikipedia.org/wiki/Monorepo) style with the various components separated into their own folders.

```
.
├── api-js
├── app
├── ci
├── clients
|   └── python
├── frontend
├── guidance
├── platform
├── scripts
└── services
```

The [ci](ci/README.md) folder contains an image used in the CI process, but the main event is the next three folders:

The [frontend](frontend/README.md) and [api-js](api-js/README.md) folders contain the two main parts parts of the application.

The [app](app/README.md) and [platform](platform/README.md) folders contain the Kubernetes configuration needed to deploy the tracker on the cloud provider of your choice. 

The clients folder contains API clients offered as an alternative to Tracker's web frontend. Only a [Python client](clients/python/README.md) is available at this time.

The scripts folder is a dumping ground for various utility scripts and codemods while services contains the code for our various scanning services.

## Application structure

In accordance with TBS policy stating developers should ["Validate your API design by consuming it"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32604#claB.2.2.4) and ["Use microservices built around business capabilities"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32602#claA.2.3.10.2), the application is designed as an API/consumer pair resulting in a minimalist microservices architecture.

Further details can be found in the README files contained in their respective folders.

## Running it

Running Tracker locally takes a few commands and a lot of RAM. See the instructions in the [app folder](app/README.md)

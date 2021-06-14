# Tracker

This project tracks Government of Canada domains for adherence to digital security best practices and federal requirements. 

## Application structure

In pursuit of a vision of [Government as a Platform](https://medium.com/digitalhks/a-working-definition-of-government-as-a-platform-1fa6ff2f8e8d), the TBS [Directive on Service and Digital](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32601) states that developers should ["Validate your API design by consuming it"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32604#claB.2.2.4) and ["Use microservices built around business capabilities"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32602#claA.2.3.10.2). Supporting this vision and taking this guidance to heart has meant that the core of the Tracker system is an API/consumer pair resulting in a minimalist microservices architecture.

The Directive also says ["Design for cloud mobility"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32602#claA.2.3.11.3), ["Use distributed architectures"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32602#claA.2.3.12.4), ["Run applications in containers"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32602#claA.2.3.10.4) and to use ["open source software first"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=32602#claA.2.3.8.1).
The technology at the intersection of these four directives is [Kubernetes](https://kubernetes.io/), which is used as a cloud agnostic platform to deploy the services that make up the Tracker system. 

## Repo Structure

As is common with microservices projects, this repository is organized in the [monorepo](https://en.wikipedia.org/wiki/Monorepo) style with the various services/components separated into their own folders.

```
.
├── api-js
├── app
├── ci
├── clients
├── CONTRIBUTING.md
├── deploy
├── frontend
├── guidance
├── Makefile
├── platform
├── README.md
├── scripts
├── SECURITY.md
└── services
```

The [ci](ci/README.md) folder contains an image used in the CI process, but the main event is the next three folders:

The [frontend](frontend/README.md) and [api-js](api-js/README.md) folders contain the two main parts parts of the application.

The [app](app/README.md), [platform](platform/README.md) and [deploy](deploy/README.md) folders contain the Kubernetes configuration needed to continuously deploy the tracker on the cloud provider of your choice. 

The clients folder contains API clients offered as an alternative to Tracker's web frontend. Only a [Python client](clients/python/README.md) is available at this time.

The services folder contains smaller services dedicated to scanning or account creation.

The scripts folder is a dumping ground for various utility scripts and codemods.


## Running it

Running Tracker locally takes a few commands and a lot of RAM. See the instructions in the [app folder](app/README.md)

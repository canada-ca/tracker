# Tracker

This project tracks the Government of Canada domains for adherence to digital security best practices and federal requirements.

## Repo Structure

This project is organized in the [monorepo](https://en.wikipedia.org/wiki/Monorepo) style with the various components separated into their own folders.

```sh
.
├── api
├── ci
├── frontend
├── platform
├── scanner
└── README.md
```

The [ci](ci/README.md) folder contains an image used in the CI process, but the main event is the next three folders:
The [frontend](frontend/README.md), and [api](api/README.md) folders containing the two main parts parts of the applicationand the [platform](platform/README.md) folder which contains the Kubernetes configuration needed to deploy the tracker on the cloud provider of your choice.

The [scanner](scanner/README.md) folder contains everything related to the old `scanner` service, which is no longer in use and is currently hanging around for reference purposes.

## Application structure

In accordance with TBS policy stating developers should ["Validate your API design by consuming it"](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=15249#claD.2.2.4), and ["Use microservices built around business capabilities."](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=15249#claC.2.3.10) the application is architected as an API/consumer pair giving a minimalist microservices architecture.

Further details can be found in the README files contained in their respective folders.

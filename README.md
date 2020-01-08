# Tracker

This project tracks the Government of Canada domains for adherence to digital security best practices and federal requirements.

## Project Structure

This project is organized in the monorepo style with the various components separationed into their own folders.

```sh
.
├── scanner
├── web
├── platform
└── README.md
```

The [scanner](scanner/README.md) folder contains everything related to the `scanner` service, the [web](web/README.md) contains everything for the `web` service that shows the results of the scan, and the [platform](platform/README.md) folder contains the Kubernetes configuration needed to deploy the tracker on the cloud provider of your choice.

Further details can be found in the readme files contained in their respective folders.

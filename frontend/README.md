# Frontend

This frontend is an example of a Single Page Application (SPA) on the [Web Platform](https://platform.html5.org).

There are lots of ways to build an application, why a SPA? As more and more APIs are added to the Web Platform (known to most as "the browser") more and more code runs on the Web Platform rather than a server or a competing platform like IOS or Android.
The language of the Web Platform is JavaScript and a SPA style application is the main way to create apps in the browser.

SPAs execute code in the browser on the users machine, which lets our applications handle spotty network connections, work offline entirely and avoid sending partial data to servers while filling out multi-stage forms.
[Betting on the web](https://joreteg.com/blog/betting-on-the-web) lets us deliver web applications on a truly open platform that are powerful, accessible, and work on a huge range of devices.

Specific to this project, the SPA architecture allows for dynamic behaviour that is needed for us to offer users to trigger their own scans and watch the progress and results appear in their browser.

As the "consumer" part of the API/consumer pair at the heart of the [Government as a Platform](https://medium.com/digitalhks/government-as-a-platform-the-hard-problems-part-1-introduction-b57269bcdc6f) model, this is assumed to be the first (but never the only) consumer of the backend API.
Shaped by user research its needs then inform the building of the API.

## Development

In addition to the frontend service, this folder contains files needed to create a good developer workflow.
Before diving into the details of the development workflow itself, it's worth talking through the thinking behind what constitutes a "good" workflow.

### The philosophy

Applications without APIs project organizational silos into the digital space.
With an API, experiences can be created that are [centered on the user](https://www.publictechnology.net/articles/features/interview-singapore%E2%80%99s-digital-chief-redesigning-government-around-%E2%80%98moments-life%E2%80%99) rather than organizational silos.

By adopting a microservices approach we can lay the foundation for a user centered service, and our new application can fit with the [TBS Directive on Management of Information Technology](https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=15249#claD.2.2.4), but the developer workflow around this isn't clear.

One possible way to do local development is to bring up a local copy of [Kubernetes](https://kubernetes.io/) in something like [Minikube](https://minikube.sigs.k8s.io/) or [Kind](https://kind.sigs.k8s.io/), and then use a tool like [skaffold](https://skaffold.dev/) to run all your services just as you would in production.

This approach can work for small sets of services, but demands extremely powerful dev machines.
Since services are developed while running every other service it's easy to build in interdependence into the system.

The big idea here is that realizing the benefits of microservices requires protecting their independence, and that requires developing them independently.
This then is the core assumption about what constitutes a "good" workflow: it must be lightweight, and let the developer develop the services independently.

### The workflow

The dev workflow being created here centre's on [Docker-compose](https://docs.docker.com/compose/), a tool that helps developers run multiple containers together.
So here we use docker-compose to bring up the frontend service with a mocked API.
Running those two services behind [Envoy](https://www.envoyproxy.io/) allows us a way to present the API at `/graphql` just as it would be in production.

The files to support this are the docker compose configuration (`docker-compose.yaml`), the config file for Envoy telling it to proxy requests to the API and frontend (`envoy-dev.yaml`).

#### Starting it

This frontend uses a simple Webpack setup which either runs a hot reloading dev server.
To start it, you need to be inside the frontend folder and run the following command:

```sh
docker-compose up -d
```

This will bring up Envoy, the mocked API and the frontend service and [detach](https://docs.docker.com/compose/reference/up/) returning the terminal to the user.
As part of this process docker compose will [bind mount](https://docs.docker.com/storage/bind-mounts/) the frontend folder into the container.
This allows changes to the code to be reflected immediately in the running container.

You can see the service running on `localhost:3000` and the API running on `localhost:3000/graphql`.
If you want to modify the schema you can reach the editor at `localhost:3000/editor`.

#### Stopping

When you are done:

```sh
docker-compose down
```

#### Installing dependencies

```sh
npm install
```

#### Running the tests

```sh
npm test
```

#### Running the linter

The linter performs a code analysis that flags programming errors, bugs, stylistic errors, and suspicious constructs.
Style errors are determined by the prettier configuration in `.prettierrc`, and plugins exist for automatically formatting code on file save.

```sh
npm run lint
```

### The Mocker

The mocker is used to create API data for use on the local instance of Tracker when using docker.
It can be used to create specific behaviours in the app in order to test certain behaviours and features.

### Building the Application

The frontend is built using [React](https://reactjs.org/docs/getting-started.html).
React uses JSX allow for the creation of HTML elements inside Javascript.
These elements support the use of variables and any other Javascript inside them by wrapping the Javascript inside of `{}`.

The frontend user interface is styled using [Chakra](https://chakra-ui.com/).
Chakra contains many React components that are used for designing page layouts.
Chakra also allows for the use of ['style props'](https://chakra-ui.com/docs/features/style-props), which apply css properties to components.
Chakra comes with a default theme, that Tracker extends in [/frontend/src/theme/canada.js](https://github.com/canada-ca/tracker/blob/master/frontend/src/theme/canada.js).
The theme contains colour, size, and spacing definitions, along with default component styles and custom component variants.

The frontend communicates to the database API using [GraphQL](https://graphql.org/).
The primary interactions are queries, used for requesting data from the database, and mutations, used for manipulating data in the database.
The faked_schema.js is used to define the inputs and returns, and their corresponding types when running a local copy of Tracker.

The /src/ folder is organized into folders for each page, along with:
an app folder for the overall structure of the page;
an auth folder for all the login and account creation pages;
a components folder for any shared components;
and a utilities folder for functions.

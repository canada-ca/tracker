# Frontend

This frontend is an example of a Single Page Application (SPA) on the [Web Platform](https://platform.html5.org).

There are lots of ways to build an application, why a SPA? As more and more APIs are added to the Web Platform (known to most as "the browser") more and more code runs on the Web Platform rather than a server or a competing platform like IOS or Android. The langauge of the Web Platform is JavaScript and a SPA style application is the main way to create apps in the browser.

SPAs execute code in the browser on the users machine, which lets our applications handle spotty network connections, work offline entirely and avoid sending partial data to servers while filling out multi-stage forms. [Betting on the web](https://joreteg.com/blog/betting-on-the-web) lets us deliver web applications on a truly open platform that are powerful, accessible, and work on a huge range of devices.

Specific to this project, the SPA architecture allows for dynamic behaviour that is needed for us to offer users to trigger their own scans and watch the progress and results appear in their browser.

As the "consumer" part of the API/consumer pair at the heart of the [Government as a Platform](https://medium.com/digitalhks/government-as-a-platform-the-hard-problems-part-1-introduction-b57269bcdc6f) model, this is assumed to be the first (but never the only) consumer of the backend API. Shaped by user research its needs then inform the building of the API.


### Running the frontend

This frontend uses a simple Webpack setup which either runs a hot reloading dev server, or builds a production bundle.

Production:

```sh
# install the dependencies
npm install
npm run build
npm start
```
Development:

```sh
npm install
npm run dev
```

### Running the tests

```sh
npm test
```


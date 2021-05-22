# Load testing

This directory contains scripts to load test Tracker using the [k6](https://k6.io) testing tool.

## Testing the frontend

Invoking k6 with the following options will run our test with 5 simulated users for 10 seconds:

```sh
k6 run -u 5 -d 10s frontend.js
```


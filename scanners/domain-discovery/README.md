# DNS scanner

This service uses [Findomain](https://github.com/Findomain/Findomain) for subdomain discovery from a base domain.

## Running it

```
pipenv install
pipenv run service
```

## Inputs and outputs

When running the service subscribes to the topic specified with `SUBSCRIBE_TO`, which is `domains.*.discovery` by default.
Publishing a message on that topic will trigger the service to run its checks.

```
nats pub domains.8017518.discovery '{"domain": "pensezcybersecurite.gc.ca", "domain_key": "8017518", "selectors": [], "orgId": "organizations/:key"}'
```

You can watch for the output using `nats sub "domains.*"` or to catch everything `nats sub "domains.>"`

## TODO

Figure out a way to clean up the [log output](https://stackoverflow.com/questions/64601400/python-suppress-a-particular-output-message).

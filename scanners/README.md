# scanners@next

This is a folder containing the next iteration of Trackers scanning infrastructure.

## What's going on

The basic flow starts with the `domain-dispatcher` doing the equivalent of the following for each object found in the `domains` collection:

```sh
nats pub domains.8017518 '{"domain": "pensezcybersecurite.gc.ca", "domain_key": "8017518", "user_key": null, "shared_id": null, "selectors": []}'
```

The `https-scanner` that has essentially done `nats sub domains.*`, and after doing its scan does the equivalent of the following command:

```sh
nats pub "domains.8017518.https" '{"results": {"implementation": "Valid HTTPS", "enforced": "Strict", "hsts": "HSTS Fully Implemented", "hsts_age": 31536000, "preload_status": "HSTS Not Preloaded", "expired_cert": false, "self_signed_cert": false, "cert_revocation_status": "Valid", "cert_bad_hostname": false}, "scan_type": "https", "user_key": null, "domain_key": "8017518", "shared_id": null}'
```
The `https-processor` does the equivalent of `nats sub domains.*.https`, receives whatever shows up there, does final processing and updates the domain in the database.


## Running it

### Starting the database and the message broker

We need to start ArangoDB and create a `track_dmarc` database collections for `domains` and `https`.
We'll also insert test data in the domains collection.
We can do this with [arangosh](https://www.arangodb.com/docs/stable/programs-arangosh.html).

```sh
docker-compose up -d arangodb nats
Creating scanners_nats_1     ... done
Creating scanners_arangodb_1 ... done
```

### A little setup

With the `domain-dispatcher` publishing items from a collection, and processors writing results back to collections, we need to create those collections, and make sure there is a domain in there to publish.

```
$ arangosh --javascript.execute database-setup.js
$ arangosh --server.database track_dmarc --javascript.execute-string 'db._collection("domains").save({ "_key": "55433876", "_id": "domains/55433876", "_rev": "_c6MGi8S--A", "domain": "cyber.gc.ca", "lastRan": "2021-09-08 00:00:22.676884", "selectors": [], "status": { "dkim": "fail", "dmarc": "pass", "https": "fail", "spf": "pass", "ssl": "fail"  }, "phase": "maintain" })'
Please specify a password: 
```

### Scanners and processors

The scanners and processors do what the names suggest: Scanners connect to the domains and publish what they find, the processors do some interpretation and save it to the database.
```sh
$ docker-compose up -d https* dns* tls*
...
```

### Running the dispatcher

Finally, we run the service that pulls that test domain from the db and publishes it, kicking off the chain.

```sh
$ docker-compose up domain-dispatcher
...
Creating scanners_domain-dispatcher_1 ... done
Attaching to scanners_domain-dispatcher_1
domain-dispatcher_1  | 
domain-dispatcher_1  | > domain-dispatcher@1.0.0 start
domain-dispatcher_1  | > node --experimental-vm-modules index.js
domain-dispatcher_1  | 
domain-dispatcher_1  | {
domain-dispatcher_1  |   severity: 'INFO',
domain-dispatcher_1  |   time: '2021-09-03T03:32:10.621Z',
domain-dispatcher_1  |   message: 'Dispatched 1 domains in 0.008 seconds'
domain-dispatcher_1  | }
scanners_domain-dispatcher_1 exited with code 0
```

### Knowing that it worked

The purpose of this exercise is to pull a domain, scan it and put the results in the https collection. If that worked you'll be able to see lots of JSON output from the following query.

```sh
arangosh --quiet --server.database track_dmarc --javascript.execute query-results.js
```

## Watching events

You can subscribe to all the events for debugging purposes with `nats sub "domains.>"`

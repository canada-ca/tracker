# scanners@next

This is a folder containing the next iteration of Trackers scanning infrastructure.

## What's going on

The basic flow starts with the `domain-dispatcher` doing the equivalent of the following for each object found in the `domains` collection:

```sh
nats pub domains.8017518 '{"domain": "pensezcybersecurite.gc.ca", "domain_key": "8017518", "user_key": null, "shared_id": null, "selectors": []}'
```

The `https-scanner` that has essentially done `nats sub domains.*`, and after doing it's scan does the equivalent of the following command:

```sh
nats pub "domains.8017518.https" '{"results": {"implementation": "Valid HTTPS", "enforced": "Strict", "hsts": "HSTS Fully Implemented", "hsts_age": 31536000, "preload_status": "HSTS Not Preloaded", "expired_cert": false, "self_signed_cert": false, "cert_revocation_status": "Valid", "cert_bad_hostname": false}, "scan_type": "https", "user_key": null, "domain_key": "8017518", "shared_id": null}'
```
The `https-processor` does the equivalent of `nats sub domains.*.https`, receives whatever shows up there, does final processing and updates the domain in the database.


## Running it

### Starting the database

We need to start ArangoDB and create a `track_dmarc` database collections for `domains` and `https`.
We'll also insert the following test data in the domains collection:

```json
{"_key":"8017518","_id":"domains/8017518","_rev":"_cPBc_9W--A","domain":"pensezcybersecurite.gc.ca","lastRan":"2021-04-27 01:00:28.674415","phase":"maintain","selectors":"","status":{"dkim":"pass","dmarc":"pass","https":"fail","spf":"pass","ssl":"fail"}}
```
We can do this with [arangosh](https://www.arangodb.com/docs/stable/programs-arangosh.html).

```sh
$ docker-compose up -d arangodb 
Creating scanners_arangodb_1 ... done
$ arangosh --javascript.execute-string 'db._createDatabase("track_dmarc"); db._useDatabase("track_dmarc"); db._createDocumentCollection("domains"); db._createDocumentCollection("https")'
$ arangosh --server.database track_dmarc --javascript.execute-string 'db._collection("domains").save({"_key":"8017518","_id":"domains/8017518","_rev":"_cPBc_9W--A","domain":"pensezcybersecurite.gc.ca","lastRan":"2021-04-27 01:00:28.674415","phase":"maintain","selectors":"","status":{"dkim":"pass","dmarc":"pass","https":"fail","spf":"pass","ssl":"fail"}})'
Please specify a password: 
```

### Starting the scanners, processor and Nats

The scanner and result process do what the names suggest, and [Nats](https://nats.io/) is the pub/sub service that ties everything together:
```sh
$ docker-compose up -d nats https-scanner https-processor 
Creating scanners_nats_1 ... done
Creating scanners_https-scanner_1   ... done
Creating scanners_https-scanner_2   ... done
Creating scanners_https-scanner_3   ... done
Creating scanners_https-scanner_4   ... done
Creating scanners_https-scanner_5   ... done
Creating scanners_https-scanner_6   ... done
Creating scanners_https-scanner_7   ... done
Creating scanners_https-scanner_8   ... done
Creating scanners_https-scanner_9   ... done
Creating scanners_https-scanner_10  ... done
Creating scanners_https-processor_1 ... done
```

### Running the dispatcher

Finally we run the service that pulls our domain from the db and publishes it.
That to kick of the scan/process/update chain.

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
domain-dispatcher_1  | 
}
domain-dispatcher_1  | npm notice 
domain-dispatcher_1  | npm notice New minor version of npm available! 7.15.1 -> 7.22.0
domain-dispatcher_1  | npm notice Changelog: <https://github.com/npm/cli/releases/tag/v7.22.0>
domain-dispatcher_1  | npm notice Run `npm install -g npm@7.22.0` to update!
domain-dispatcher_1  | npm notice 
scanners_domain-dispatcher_1 exited with code 0
```

### Knowing that it worked

The purpose of this exercise is to pull a domain, scan it and put the results in the https collection. If that worked you'll be able to see a result in the collection:


## Watching events

You can subscript to all the events for debugging purposes with `nats sub domains.>`
```sh
$ arangosh --server.database track_dmarc --javascript.execute-string 'console.log(JSON.stringify(db._query("RETURN https").toArray()))'
2021-09-03T23:16:35Z [1799769] INFO [99d80] [[{"_key":"556","_id":"https/556","_rev":"_c41kNme---","timestamp":"2021-09-03 23:02:32.838233","implementation":"Valid HTTPS","enforced":"Strict","hsts":"HSTS Fully Implemented","hstsAge":31536000,"preloaded":"HSTS Not Preloaded","rawJson":{"implementation":"Valid HTTPS","enforced":"Strict","hsts":"HSTS Fully Implemented","hsts_age":31536000,"preload_status":"HSTS Not Preloaded","expired_cert":false,"self_signed_cert":false,"cert_revocation_status":"Valid","cert_bad_hostname":false},"neutralTags":["https12"],"positiveTags":[],"negativeTags":[]}]]
```

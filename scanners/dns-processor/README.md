# DNS processor

This is an event driven version of the https scanner, using [Nats](https://nats.io).

## Running it

```
poetry install
poetry run service
```


## Testing it

```
nats pub "domains.8017518.dns" '{"results": {"domain": "pensezcybersecurite.gc.ca", "base_domain": "pensezcybersecurite.gc.ca", "dnssec": false, "ns": {"hostnames": ["ns41.ent.global.gc.ca", "ns11.ent.global.gc.ca", "ns10.ent.global.gc.ca", "ns40.ent.global.gc.ca"], "warnings": []}, "mx": {"hosts": [{"preference": 10, "hostname": "mx1.canada.ca", "addresses": ["205.193.214.140"]}, {"preference": 10, "hostname": "mx2.canada.ca", "addresses": ["205.193.214.105"]}], "warnings": []}, "spf": {"record": "v=spf1 redirect=transition._spf.canada.ca", "valid": true, "dns_lookups": 3, "warnings": [], "parsed": {"pass": [], "neutral": [], "softfail": [], "fail": [], "include": [], "redirect": {"domain": "transition._spf.canada.ca", "record": "v=spf1 mx:canada.ca mx:mx.ssan.seg-egs.gc.ca ip4:205.193.86.223 ip4:205.193.117.44 ?all", "dns_lookups": 2, "parsed": {"pass": [{"value": "mx1.canada.ca", "mechanism": "mx"}, {"value": "mx2.canada.ca", "mechanism": "mx"}, {"value": "mx.ssan.egs-seg.gc.ca", "mechanism": "mx"}, {"value": "205.193.86.223", "mechanism": "ip4"}, {"value": "205.193.117.44", "mechanism": "ip4"}], "neutral": [], "softfail": [], "fail": [], "include": [], "redirect": null, "exp": null, "all": "neutral"}, "warnings": []}, "exp": null, "all": "neutral"}}, "dmarc": {"record": "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@cyber.gc.ca; ruf=mailto:dmarc@cyber.gc.ca; fo=1", "valid": true, "location": "pensezcybersecurite.gc.ca", "warnings": [], "tags": {"v": {"value": "DMARC1", "explicit": true}, "p": {"value": "reject", "explicit": true}, "pct": {"value": 100, "explicit": true}, "rua": {"value": [{"scheme": "mailto", "address": "dmarc@cyber.gc.ca", "size_limit": null}], "explicit": true, "accepting": true}, "ruf": {"value": [{"scheme": "mailto", "address": "dmarc@cyber.gc.ca", "size_limit": null}], "explicit": true, "accepting": true}, "fo": {"value": ["1"], "explicit": true}, "adkim": {"value": "r", "explicit": false}, "aspf": {"value": "r", "explicit": false}, "rf": {"value": ["afrf"], "explicit": false}, "ri": {"value": 86400, "explicit": false}, "sp": {"value": "reject", "explicit": false}}}, "dkim": {"error": "missing"}}, "scan_type": "dns", "user_key": "1", "domain_key": "8017518", "shared_id": 1}'
```

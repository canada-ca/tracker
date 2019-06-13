# Data Definition
This document outlines the input and output data of the scanning portion of the system, explaining values and their meaning.

## Output Data Definition

### domains collection - individual domain level scan results

| Field             | Definition        |
| ----------------- | ----------------- |
| \_id | Unique ID |
|domain | Domain name |
| base_domain | Parent if domain is a subdomain, or same domain if it is a parent |
| organization_name_en | Organization name in English |
| organization_name_fr |  Organization name in French |
| organization_slug | organization_name_en with spaces/special characters normalized/removed. |
| sources | Domain list that domain originated from
| is_owner | Flag for if the domain is an owner (associated with a break-point in what organization owns subdomains)
| is_parent | Flag for if domain is a parent (will have it's own entry on domains page). |
| exclude | Unused, to be removed |
| live | If site is reachable (can connect to it) |
| redirect | If domain redirects |
| canonical | Domain with one of "http://", "http://www", "https://", or "https://www" prefix, depending on the redirect behaviour of the domain |
| https.eligible | Site is live or not |
| https.eligible_zone | True if domain is parent that is either live itself, or has live subdomains |
| https.uses | Presence of HTTPS <br>< 1 - No HTTPS<br>1 - has HTTPS, but problem in the chain<br>2 - Has HTTPS |
| https.enforces | Enforcement of HTTPS connections<br>0 - Does not enforce HTTPS<br>1 - HTTPS is present, but not enforced<br>2 - HTTPS is present, and eventually redirected to<br> 3 - HTTPS is present, and immediately redirected to |
| https.hsts | Presence of HSTS<br>-1 - No HTTPS<br>0 - No HSTS<br>1 - HSTS Max ages too short<br>2 - Has HSTS<br>3 - parent domain has preloaded HSTS |
| https.compliant | Compliance with ITPIN |
| https.preloaded | Flag for if domain has preloaded HSTS<br>-1<br>0<br>1<br>2 |
| https.hsts_age | Max age specified in the hsts-max-age header |
| https.bod_crypto | Aggregation of various smaller crypto checks<br>-1 - N/A (No HTTPS)<br>0.- Bad crypto present (rc4, 3des, sslv2, sslv3, tlsv10, tlsv11, non sha256+ signature)<br>No problems found |
| https.rc4 | Presence of RC4 |
| https.3des | Presence of 3DES |
| https.sslv2 | Presence of SSLv2 |
| https.sslv3 | Presence of SSLv3 |
| https.tlsv10 | Accepts TLSv1.0 |
| https.tlsv11 | Accepts TLSv1.1 |
| https.good_cert | Uses SHA-256+ for signature algorithm |
| https.signature_algorithm | What signature algorithm is used |
| https.accepted_ciphers | Boolean for if uses only supported ciphers |
| https.bad_ciphers | List of non-supported ciphers used |
| totals | This section is a count of the metrics in the `https` blob for this domain and its subdomains |

### organizations collection - Total counts for domains owned by organization

| Field             | Definition        |
| ----------------- | ----------------- |
| \_id | Unique ID |
| name_en | Organization name in English |
| name_fr | Organization name in French |
| slug | organization_name_en with spaces/special characters normalized/removed |
| total_domains | number of domains owned by this organization |
| https | This section is a count of the metrics related to HTTPS for all domains owned by this organization |
| crypto | This section is a count of the metrics related to crypto (TLS Cert checks) for all domains owned by this organization |
| preloading | This section is a count of the metrics related to HSTS preloading for all domains owned by this organization |

### reports collection - Total counts of stats from the domains collection

| Field             | Definition        |
| ----------------- | ----------------- |
| \_id | Unique ID |
| https | This section is a count of the metrics related to HTTPS for all domains that have been scanned  |
| crypto | This section is a count of the metrics related to crypto for all domains that have been scanned |
| preloading | This section is a count of the metrics related to HSTS preloading for all domains owned by this organization |
| report_date | Last scan date |

----

## Input Data Definition

This data is meant to be pulled down into local CSVs via the `tracker preprocess` command to be used with the scanning. This input data is stored in the database to facilitate updating the list of domains to scan or updating the domain owners without needing to redeploy the application.

The scanner being setup to pull the data at the start of the scan means that to update what gets scanned, simply update the data in the database (manually or via the `tracker update` command)

### owner collection - List of domain owners for subdomain grouping

| Field             | Definition        |
| ----------------- | ----------------- |
| \_id | Unique ID |
| domain | Domain |
| organization_en | Owner organization name in English |
| organization_fr | Owner organization name in French |

### domains collection - Input data to scan

| Field             | Definition        |
| ----------------- | ----------------- |
| \_id | Unique ID |
| domain | Domain |

### ciphers collection - Allowed cipher list

| Field             | Definition        |
| ----------------- | ----------------- |
| \_id | Unique ID |
| cipher | Name of cipher |

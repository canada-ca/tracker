# Domain ownership

This document explains how domains are mapped back to the organization that owns them after the scanning process.

## Data Description

There are two data sources involved in the determining of ownership, `domains.csv` and `owners.csv`.

`domains.csv` is simply the list of domains to scan. No concept of ownership or organization is involved in this data.  
`owners.csv` is a list of domains with the name of the organization that owns them. This is used to determine the owner of each domain in `domains.csv`

**NOTE**: Although it seems like the `owners.csv` list is redundant and the information could just be contained within one data source (just put organizations along with the domains in `domains.csv`) there is in fact a reason to separate these into two separate lists. This will be made clear by the end of the document.

## The Algorithm

During the scan results processing stage, the domains are linked up with their owners. This is done via the following process.  
Take the following dataset:

`domains.csv`

| domain                       |
| ---------------------------- |
| canada.ca                    |
| consultations-edsc.canada.ca |
| digital.canada.ca            |
| 2006census.gc.ca             | 

`owners.csv`

| domain            | organization_name_en                     | organization_name_fr                         |
| ----------------- | ---------------------------------------- | -------------------------------------------- | 
| canada.ca         | Employment and Social Development Canada | Famille, Enfants et Développement social     |
| digital.canada.ca | Treasury Board of Canada Secretariat     | Secrétariat du Conseil du Trésor du Canada   |

To link up the domains to their owners, the following steps are taken:  
for each domain in the domain list:  
1. Check for its existence in the owner list, if it is present take the organization information and stop further processing for this domain.
2. Split the domain up into pieces based on the `.` character.
3. Remove the first piece and join the remaining pieces back together with `.` characters.
4. Return to step `1`.
5. If all the pieces are removed until there are none left, and a match was still not found in the owners list, default to the organization "Government of Canada".

For the above dataset that will result in the following:  

| domain                       | organization_name_en                     | organization_name_fr                         |
| ---------------------------- | ---------------------------------------- | -------------------------------------------- | 
| canada.ca                    | Employment and Social Development Canada | Famille, Enfants et Développement social     |
| consultations-edsc.canada.ca | Employment and Social Development Canada | Famille, Enfants et Développement social     |
| digital.canada.ca            | Treasury Board of Canada Secretariat     | Secrétariat du Conseil du Trésor du Canada   |
| 2006census.gc.ca             | Government of Canada                     | Gouvernement du Canada                       |

* `canada.ca` - was in the owners list, so immediately picked up the organization info from its entry
* `consultations-edsc.canada.ca`
    1. `consultations-edsc.canada.ca` was not present
    2. `canada.ca` was present, so take its organization info
* `digital.canada.ca` - was in owners list, so immediately picked up the organization info from its entry
* `2006census.gc.ca`
    1. `2006census.gc.ca` was not present
    2. `gc.ca` was not present
    3. `ca` was not present
    4. No entry found, defaulting to `Government of Canada` organization

The main advantage this has over simply including the organization information with the domains in one large list is that new subdomains can be added to the domain list without worrying about who the owner is.
If the domain is a subdomain of an existing tracked domain it will pick up the information automatically.

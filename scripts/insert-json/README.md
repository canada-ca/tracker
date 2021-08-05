# Data population script

This directory contains a program to facilitate the insertion of organization and domain data from a .json file.

The .json file used for input must adhere to the following structure:

```
"<English Acronym-French Acronym>": {
        "acronym_en": "<English Acronym>",
        "acronym_fr": "<French Acronym>",
        "organization_en": "<English organization name>",
        "organization_fr": "<French organization name>",
        "domains": [
            <Comma-separated list of quotation-wrapped domain names>
        ]
}
```

Below is an example of this structure:

```
"CRA-ARC": {
        "acronym_en": "cra",
        "acronym_fr": "arc",
        "organization_en": "Canada Revenue Agency",
        "organization_fr": "Agence du revenu du Canada",
        "domains": [
            "not-a-real-domain.ca",
            "another-domain-name.ca"
        ]
}
```

## NOTE: If you do not already have Node.js/npm installed, you will need to [do so](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to use this program.

First, create a file called '.env' in this directory with the following contents:

```
DB_PASS=<Database Password>
DB_URL=<Database URL>
DB_NAME=<Name of Database>
```


Then, install all dependencies:

```
$ npm install
```


Once the .json input file has been placed within this directory, run the following command to begin populating the database:

```
$ npm run start
```

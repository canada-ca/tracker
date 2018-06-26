[![CircleCI](https://circleci.com/gh/cds-snc/tracker.svg?style=svg)](https://circleci.com/gh/cds-snc/tracker)
[![Known Vulnerabilities](https://snyk.io/test/github/cds-snc/tracker/badge.svg)](https://snyk.io/test/github/cds-snc/tracker)

## Track Government of Canada domains's adherance to digital security practices

How the GC domain space is doing at best practices and federal requirements.

| Documentation                                           |
| ------------------------------------------------------- |
| [Development Setup Instructions](#development-setup)    |
| [Local Deploy Step-by-step](docs/local-instructions.md) |
| [Deployment Docs](docs/deploy.md)                       |

## Developer Notes

This repository is using [snyk](https://snyk.io/org/cds-snc) to scan our dependencies for vulnerabilities.  
Unfortunatly Synk lacks the ability to detect the dependencies listed in the `setup.py` file.
To get around this we are have the dependencies synced between the `setup.py` and `requirements.txt` (which snyk can scan) files.  
If you are developing this and add an aditional dependency, make sure to add it to both locations

## Development Setup

For development purposes it is recommended that you install [mongodb](https://www.mongodb.com/) and run the database locally.

This utility is written for **Python 3.5 and up**. We recommend [pyenv](https://github.com/yyuu/pyenv) for easy Python version management.

To setup local python dependencies you can run `make setup` from the root of the repository. We recommend that this is done from within a virtual environment

* Install dependencies:

```bash
pip install -r requirements.txt
```

* If developing tracker, you will also need the development requirements
```bash
pip install .[development]
```

#### Install domain-scan and dependencies

Download and set up `domain-scan` [from GitHub](https://github.com/cds-snc/domain-scan) as per it's setup instructions.

`domain-scan` in turn requires [`pshtt`](https://github.com/dhs-ncats/pshtt) and [`sslyze`](https://github.com/nabla-c0d3/sslyze). These can be installed directly via `pip`.

The app requires you to set one environment variable:

* `DOMAIN_SCAN_PATH`: A path to `domain-scan`'s `scan` binary.
* `DOMAIN_GATHER_PATH`: A path to `domain-scan`'s `gather` binary.

However, if you don't have `pshtt` and `sslyze` on your PATH, then `domain-scan` may need you to set a couple others:

* `PSHTT_PATH`: Path to the `pshtt` binary.
* `SSLYZE_PATH`: Path to the `sslyze` binary.

#### Then run it

```
tracker run
```

This will kick off the `domain-scan` scanning process for HTTP/HTTPS and DAP participation, using the domain lists as specified in `data/data_meta.yml` for the base set of domains to scan.

Then it will run the scan data through post-processing producing some JSON and CSV files as scan artifacts and finally uploading the results into the database that the frontend uses to render the information (by default if not further specified `localhost:21017/track`).

For a more detailed step by step procedue of getting a local development deployment going, checkout out the [Local Deploy Step-by-step](docs/local-instructions.md) document!

#### Scanner CLI

The utility has a CLI that can be used to perform individual parts of the scanning in isolation of the other steps.
By following the steps to setup the Scanning portion, this CLI should be readily accessable to you (if you have activated the environment you installed it into).
As you may have guesed from the command in the previous section, the CLI command is `tracker`.

Help on how to use the CLI can be output via the command `tracker --help`


## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.

### Origin 

This project was originally forked from [18F](https://github.com/18f/pulse) and has been modified to fit the Canadian context.

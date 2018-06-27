## Local Deployment Walkthrough

This document is meant to show in unambiguious manner how to deploy a instance of this app locally from first principals.

### Environment Setup

#### Required Software

For development purposes it is recommended that you install [mongodb](https://www.mongodb.com/) and run the database locally.  
This utility is written for **Python 3.5 and up**. We recommend [pyenv](https://github.com/pyenv/pyenv) for easy Python version management. Regardless of the manner you choose to do so, you will need an instalation of Python 3.5+ to continue.  
The project uses [mongodb](https://www.mongodb.com/) as it's datastore. Depending on your platform installation will be different, please follow the installation instructions found on their site for installing the MongoDB Community Server.

Once MongoDB has been installed, we will have to run an instance of the database locally.  
To do so open a terminal window and run the following command:
```bash
mongod &
```

If you get an error related to the directory `/data/db`, usually that means you have to create that directory. If you already have created the directory and are still recieving an error, it is likely due to the fact that the user that runs the `mongod` command must be the owner of that directory.


#### Acquiring the source

As you are reading this, you likely already have a copy of the source code. However if this is not the case, it can be found on [github](https://github.com/cds-snc/tracker). You will need to clone this repository to a local directory.
```bash
git clone https://github.com/cds-snc/tracker.git
cd tracker
```

You will also need to download the contents of the [domain-scan](https://github.com/cds-snc/domain-scan) repository, also on github. This code is used to do produce the results that the dashboard displays.
```bash
git clone https://github.com/cds-snc/domain-scan.git
```

Keep the terminal you ran these commands in around for the following steps.

#### Environment

First, verify that you have the correct version of python.
```bash
python3 --version
```
It should print out something like `Python 3.5.5`. You will need a version 3.5+.

We recommend that the python packages that comprise this project be installed into virtual environments. To do so execute the following commands.
```bash
cd tracker
python3 -m venv .env
. .env/bin/activate
pip3 install -e .
pip3 install -r domain-scan/requirements.txt
pip3 install -r domain-scan/requirements-scanners.txt
```

The components of this project make use of a number of environment variables, but there are four that are the most common. They are as follows...  
* **DOMAIN_SCAN_PATH** (required for scanning) - This is the path to the location the `scan` file in the directory created when you [downloaded domain-scan](#Acquiring the source)
* **DOMAIN_GATHER_PATH** (required for scanning) - This is the path to the location the `gather` file in the directory created when you [downloaded domain-scan](#Acquiring the source)
* **TRACKER_ENV** - This is an indicator of what mode the site should run in (which affects how it is configured). It has three possible values
  * **testing** - Attempts to connect to a local DB running on the default port with a randomized database name. This is intended to only be used when testing the application (and is used automatically)
  * **development** (default) - Attempts to connect to a local DB running on the default port
  * **production** - Attempts to connect to a DB specififed by the environment variable TRACKER_MONGO_URI
* **TRACKER_MONGO_URI** - The connection string used to connect to the database when the site is running in production, and what the scanner will connect to if not manually set.

```bash
export DOMAIN_SCAN_PATH=$(pwd)/domain-scan/scan
export DOMAIN_GATHER_PATH=$(pwd)/domain-scan/gather
export TRACKER_ENV=development
export TRACKER_MONGO_URI=mongodb://localhost:27017/track
```

### Data Initialization

To initalize mongodb with some data for the dashboard to display, we must run a scan on some domains. This will require two lists, one of parent domains (second level domains) and one of subdomains. Run the following commands to generate a very small example set.
```bash
mkdir csv
cat > ./csv/owners.csv << EOF
domain,filler,organization_en,organization_fr
canada.ca,,Government of Canada,Gouvernement du Canada
digital.canada.ca,,Treasury Board of Canada Secretariat,Secrétariat du Conseil du Trésor du Canada
numerique.canada.ca,,Treasury Board of Canada Secretariat,Secrétariat du Conseil du Trésor du Canada
EOF
cat > ./csv/domains.csv << EOF
domain
canada.ca
digital.canada.ca
numerique.canada.ca
open.canada.ca
ouvert.canada.ca
EOF
cat > ./csv/ciphers.csv << EOF
cipher
TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
TLS_ECDHE_ECDSA_WITH_AES_128_CCM
TLS_ECDHE_ECDSA_WITH_AES_256_CCM
TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256
TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384
TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA
TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA
TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256
TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384
TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA
TLS_DHE_RSA_WITH_AES_128_GCM_SHA256
TLS_DHE_DSS_WITH_AES_128_GCM_SHA256
TLS_DHE_RSA_WITH_AES_256_GCM_SHA384
TLS_DHE_DSS_WITH_AES_256_GCM_SHA384
TLS_DHE_RSA_WITH_AES_128_CCM
TLS_DHE_RSA_WITH_AES_256_CCM
TLS_DHE_DSS_WITH_AES_128_CBC_SHA256
TLS_DHE_RSA_WITH_AES_128_CBC_SHA256
TLS_DHE_DSS_WITH_AES_256_CBC_SHA256
TLS_DHE_RSA_WITH_AES_256_CBC_SHA256
TLS_DHE_DSS_WITH_AES_128_CBC_SHA
TLS_DHE_RSA_WITH_AES_128_CBC_SHA
TLS_DHE_DSS_WITH_AES_256_CBC_SHA
TLS_DHE_RSA_WITH_AES_256_CBC_SHA
TLS_RSA_WITH_AES_128_GCM_SHA256
TLS_RSA_WITH_AES_256_GCM_SHA384
TLS_RSA_WITH_AES_128_CCM
TLS_RSA_WITH_AES_256_CCM
TLS_RSA_WITH_AES_128_CBC_SHA256
TLS_RSA_WITH_AES_256_CBC_SHA256
TLS_RSA_WITH_AES_128_CBC_SHA
TLS_RSA_WITH_AES_256_CBC_SHA
EOF
```

Once those lists are in place, we can run a scan.
```bash
. .env/bin/activate
tracker run
```
This will run a scan on the contents of the `domains.csv` files in the `csv` directory, dumping some scan artifacts to the `data/output` directory, then load the results into the database.

### Running the app

Now that you have a set of scan data ready, head over to the [track-web](https://github.com/cds-snc/track-web) repository to complete the setup for the dashboard!

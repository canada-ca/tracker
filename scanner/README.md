# track-dmarc

## Instructions:

Ensure that Python3.6+ and pip3 are installed, and a PostgreSQL database is configured.

Alter config.py to reflect your database credentials.

Database must be populated before running.

### Install requirements

    cd /track-dmarc
    python3 setup.py
    
### Run a scan

    cd /data
    python3 cli.py

# Supporting scripts

This directory contains helpful scripts to support common application use-cases and maintenance, as well as to facilitate automated performance of trivial tasks.

All dependencies can be installed by running ```pip3 install requirements.txt``` within the corresponding script's directory

Before running scripts, please read the individual descriptions provided below:

## insert_csv
 
  Reads domains and organizations from any/all .csv files located within the current working directory, inserting if not all ready present within the database.
  
### Notes:
  
  - The first row of each .csv file is skipped, as it serves as a "header" for all subsequent rows
  - Corresponding database credentials "DB_USER", "DB_PASS", "DB_HOST", and "DB_NAME" must be present within a "config.py" located within the current working directory

## Making Additions

This document is meant to give an explanation of the location of various components of the system, and how one would change or add to them.

This utility is a python 3 application that makes use of another python application [domain-scan](https://github.com/cds-snc/domain-scan) written by [18F](https://github.com/18F). 

Domain scanning is broken into two parts, the scanning itself and processing the results. The scan management and data processing can be found in the `data` directory.

* `cli.py` - CLI definition, the intended way to interact with the tracker module as an application.
* `env.py` - module to handle reading and parsing environmental configuration. As refactoring progresses the hope is that this file is completely removed as it causes some difficulty in finding where certain important values are defined in the rest of the code.
* `logger.py` - module containing some simple code to facilitate logging.
* `models.py` - abstraction layer on top of mongodb. This module does not provide a large amount of abstraction, just enough to decouple the application from the choice of mongodb specifically if at some later point it was decided to switch to another datastore, changes to the scanner could be isolated to this module.
* `preprocess.py` - module to handle tasks that may need to be done before scaning process takes place.
* `processing.py` - module to handle scan results interpretation and analysis.
* `update.py` - module to handle coordinating `domain-scan`.

#### The scanning process

The scanning is done by [domain-scan](https://github.com/cds-snc/domain-scan), using a subset of it's capabilities, namely the [pshtt](https://github.com/dhs-ncats/pshtt) and [sslyze](https://github.com/nabla-c0d3/sslyze) scanners.  
The scan is kicked off by the `update.py` module. Unfortunatly since `domain-scan` was written as a dedicated application itself and not a library for re-use, the `update` module resorts to building command-line commands and running them with the `subprocess` module.

#### Results analysis

Once the scan is complete, `processing.py` is responsible for reading in the scan results, doing some interprettation, and finally loading the relevant results into the database.

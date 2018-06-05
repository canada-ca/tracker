## Making Additions

This document is meant to give an explanation of the location of various components of the system, and how one would change or add to them.

All content relating to the dashboard is under the `track_digital` folder at the root of the repo. The dashboard is a [Flask](http://flask.pocoo.org/) application, meaning that it uses python for page routing, data retrieval, and to render [Jinja2](http://jinja.pocoo.org/docs/latest/) templates into html that is then served to the user. The resulting HTML pages use javascript to request and display the data and handle interactions with the pages.

The backend scanning service is a python 3 application that makes use of another python application [domain-scan](https://github.com/cds-snc/domain-scan) written by [18F](https://github.com/18F). 

### Frontend Content

The frontend content is located within the `track_digital/track` subdirectory, in the `templates` and `static` directoriies.
* `static` - for static content such as javascript, css, images, etc.
* `templates` - for the Jinja2 templates

If you need to make an addition or edit to the frontend content, it will likely be isolated to one or both of these folders.  
To make an edit to the copy, simply find where it is in the `templates` directory, and make the edit (remembering to do so in both languages).
To make an edit to the page behavior or style, it is likely that an edit will need to be made to some of the static files.

**DESCRIPTION OF WHERE KEY FUNCTIONALITY IS LOCATED IN STATIC**

### Routing, page rending, and data retrieval

To make a change to the backend of the dashboard, the `.py` files in `track_digital/track` contain what you need.  
* `__init__.py` - function for creating and initializing the flask application
* `data.py` - mappings from database document property names to human readable names for the CSV export and frontend.
* `helpers.py` - small number of helper functions for the template rendering.
* `models.py` - abstraction layer on top of the database. Application makes calls into this module to interact with the database.
* `views.py` - route definitions. Code that will be executing when users attempt to visit paths (such as `/en/domains/`, which displays the English domains page).
* `wsgi.py` - simple module that just creates and holds a reference to the flask app.

### Backend Scanning

Domain scanning is broken into two parts, the scanning itself and processing the results. The scan management and data processing can be found in the `tracker/data` subdirectory.

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

## Local Deployment Walkthrough

This document is meant to show in unambiguous  manner how to deploy an instance of this app locally from first principals.

### Before you start

Before you start on these instructions, we recommend you follow the [equivalent documentation](https://github.com/cds-snc/tracker/blob/master/docs/local-instructions.md) for the [tracker](https://github.com/cds-snc/tracker) project. This will let you populate a local database with some scan data that the dashboard will then display.

### Environment Setup

#### Required Software

For development purposes it is recommended that you install [MongoDB](https://www.mongodb.com/) and run the database locally.  
This dashboard is a [Flask](http://flask.pocoo.org/) app written for **Python 3.5 and up**. We recommend [pyenv](https://github.com/pyenv/pyenv) for easy Python version management. Regardless of the manner you choose to do so, you will need an installation  of Python 3.5+ to continue.  
The project uses [MongoDB](https://www.mongodb.com/) as it's datastore. Depending on your platform installation will be different; please follow the installation instructions found on their site for installing the MongoDB Community Server.

Once MongoDB has been installed, we will have to run an instance of the database locally.  
To do so open a terminal window and run the following command:
```bash
mongod &
```

If you get an error related to the directory `/data/db`, usually that means you have to create that directory. If you already have created the directory and are still receiving  an error, it is likely due to the fact that the user that runs the `mongod` command must be the owner of that directory.

#### Acquiring the source

The source code can be found on [GitHub](https://github.com/cds-snc/track-web). You will need to clone this repository to a local directory.
```bash
git clone https://github.com/cds-snc/track-web.git
```

Keep the terminal you ran these commands in around for the following steps.

#### Environment

First, verify that you have the correct version of Python.
```bash
python3 --version
```
It should print out something like `Python 3.5.5`. You will need a version 3.5+.

We recommend that the Python packages that comprise this project be installed into virtual environments. To do so execute the following commands.
```bash
python3 -m venv .env
. .env/bin/activate
pip3 install -e .
```

### Running the app

Nearing the finish line now, all that is left is to spin up the site.
```bash
python3 track/wsgi.py
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 258-029-594
```
And that should be it! Visit `http://127.0.0.1:5000/` in your browser to see the locally deployed site.

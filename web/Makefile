all: styles

setup:
	pip install -e .[development]

debug:
	TRACKER_ENV=development DEBUG=true python track/wsgi.py

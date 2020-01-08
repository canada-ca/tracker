scss ?= track/static/scss/main.scss
css ?= track/static/css/main.css

all: styles

setup:
	pip install -e .[development]

debug:
	TRACKER_ENV=development DEBUG=true python track/wsgi.py

styles:
	sass $(scss):$(css)

watch:
	sass --watch $(scss):$(css)

clean:
	rm -f $(css)

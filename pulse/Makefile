scss ?= pulse/static/scss/main.scss
css ?= pulse/static/css/main.css

all: styles

debug:
	PULSE_ENV=development DEBUG=true python pulse/wsgi.py

styles:
	sass $(scss):$(css)

watch:
	sass --watch $(scss):$(css)

clean:
	rm -f $(css)

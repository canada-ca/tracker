FROM python:3.6
MAINTAINER David Buckley <david.buckley@cds-snc.ca>
LABEL Description="Track Digital Security Compliance" Vendor="Canadian Digital Service"

COPY setup.py deploy/setup.py 
COPY track deploy/track
COPY MANIFEST.in deploy/MANIFEST.in
RUN python -m venv .env && . .env/bin/activate
RUN pip install deploy/.

RUN groupadd -r https && useradd --no-log-init -r -g https https
USER https:https

EXPOSE 5000
ENTRYPOINT ["gunicorn", "--pythonpath=deploy/track", "--bind=0.0.0.0:5000", "--worker-class=gevent", "wsgi:app"]

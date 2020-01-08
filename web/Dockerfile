FROM python:3.5 as python-base
LABEL Description="Track Web Security Compliance" Vendor="Canadian Digital Service"

COPY requirements.txt /opt/track-web/requirements.txt
COPY setup.py /opt/track-web/setup.py 
COPY track /opt/track-web/track
COPY MANIFEST.in /opt/track-web/MANIFEST.in

RUN pip install --upgrade pip && mkdir wheels && pip wheel --no-binary :all: -r /opt/track-web/requirements.txt -w wheels && pip wheel --no-deps /opt/track-web/ -w wheels
 
RUN pip install /wheels/* && rm -rf /wheels /root/.cache/pip && \
    addgroup --system track-web && adduser --system --group track-web && \
    mkdir -p /opt/track-web/.cache && \
    chown -R track-web /opt/track-web
    
USER track-web:track-web
 
EXPOSE 5000
ENTRYPOINT ["gunicorn", "track.wsgi:app", "--bind=0.0.0.0:5000", "--worker-class=sync", "--access-logfile=-", "--error-logfile=-", "--log-level=debug", "--workers=4"]

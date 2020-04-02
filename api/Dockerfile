FROM python:3.8.2-slim-buster
LABEL maintainer="mike.williamson@tbs-sct.gc.ca"

ENV PYTHONUNBUFFERED=TRUE
ENV PIPENV_NOSPIN=TRUE

RUN set -ex \
	\
	&& savedAptMark="$(apt-mark showmanual)" \
	&& apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libffi-dev \
    postgresql-11\
    musl-dev \
    python3 \
    python3-dev

RUN addgroup -gid 1000 -system trackerapi && \
	    adduser -u 1000 -system trackerapi -gecos trackerapi

RUN pip install pipenv --no-cache-dir

COPY . /app/

WORKDIR /app
USER trackerapi
RUN pipenv sync --bare

EXPOSE 5000
CMD pipenv run server

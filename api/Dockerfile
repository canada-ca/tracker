FROM ubuntu:20.04
LABEL maintainer="mike.williamson@tbs-sct.gc.ca"

ENV PYTHONUNBUFFERED=TRUE
ENV PIPENV_NOSPIN=TRUE
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive

RUN set -ex \
	\
	&& savedAptMark="$(apt-mark showmanual)" \
	&& apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libffi-dev \
    postgresql \
    postgresql-contrib \
    musl-dev \
    python3.8 \
    python3-dev \
    python3-pip

RUN addgroup -gid 1000 -system trackerapi && \
	    adduser -u 1000 -system trackerapi -gecos trackerapi

RUN python3 -m pip install --upgrade setuptools
RUN python3 -m pip install wheel
RUN python3 -m pip install pipenv --no-cache-dir

COPY . /app/

ENV PYTHONPATH=/app

WORKDIR /app
USER trackerapi
# RUN pipenv sync --bare
RUN pipenv -r requirements.txt

EXPOSE 5000
CMD pipenv run server

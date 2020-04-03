FROM ubuntu:19.10
LABEL maintainer="mike.williamson@tbs-sct.gc.ca"

ENV PYTHONUNBUFFERED=TRUE
ENV PIPENV_NOSPIN=TRUE
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

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

RUN pip3 install --upgrade setuptools
RUN pip3 install pipenv --no-cache-dir

COPY . /app/

WORKDIR /app
USER trackerapi
RUN pipenv sync --bare

EXPOSE 5000
CMD pipenv run server

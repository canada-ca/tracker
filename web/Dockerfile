FROM python:3.6-alpine
LABEL maintainer="mike.williamson@tbs-sct.gc.ca"

RUN apk add -U --no-cache openssl-dev libffi-dev \
	build-base postgresql-libs postgresql-dev musl-dev \
 	python3 python3-dev
RUN addgroup -g 1000 -S trackerapp && \
	    adduser -u 1000 -S trackerapp -G trackerapp

RUN pip install pipenv --no-cache-dir

COPY Pipfile* /opt/track-web/
COPY track /opt/track-web/track

WORKDIR /opt/track-web
USER trackerapp
RUN pipenv sync --bare

EXPOSE 5000
CMD pipenv run start

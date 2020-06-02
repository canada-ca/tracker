FROM ubuntu:20.04

# Python, don't write bytecode!
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED TRUE
ENV PIPENV_NOSPIN TRUE
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get install openssl-dev libffi-dev build-base postgresql-libs \
      postgresql-dev musl-dev python3 python3-dev python3-pip nodejs-npm
RUN pip3 install pipenv

FROM ubuntu:24.04

# Python, don't write bytecode!
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED TRUE
ENV PIPENV_NOSPIN TRUE
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get install -y --no-install-recommends libssl-dev libffi-dev build-essential \
      python3 python3-dev python3-pip nodejs
RUN pip3 install --no-cache-dir pipenv

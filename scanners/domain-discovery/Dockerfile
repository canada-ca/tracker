FROM python:3.11.2-slim-bullseye AS python-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    build-essential \
    python3-dev \
    python3-venv \
    curl \
    unzip

ENV VIRTUAL_ENV=/home/scanner/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY requirements.txt ./
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r ./requirements.txt --no-cache-dir

RUN shot-scraper install

RUN curl -LO https://github.com/findomain/findomain/releases/latest/download/findomain-linux.zip
RUN unzip findomain-linux.zip
RUN chmod +x findomain
RUN mv findomain /usr/bin/findomain
RUN findomain --help

CMD ["python3", "domain_discovery.py"]


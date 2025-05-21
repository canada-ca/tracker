FROM python:3.13.2-slim-bookworm AS python-builder

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

WORKDIR /working/install

RUN apt-get update && apt-get install -y  --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    build-essential \
    python3-dev

COPY requirements.txt /requirements.txt
# Install python requirements to /working/install directory for cleaner copy
RUN pip3 install --prefix=/working/install -r /requirements.txt

#===============================================================================================
#===============================================================================================

FROM python:3.13.2-slim-bookworm

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

WORKDIR /dns-processor

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib

COPY service.py dns_processor_cli.py ./
COPY dns_processor ./dns_processor
COPY notify ./notify

RUN useradd -ms /bin/bash scanner
USER scanner

CMD ["python3", "service.py"]

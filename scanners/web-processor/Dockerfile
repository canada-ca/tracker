FROM python:3.12.8-slim-bookworm AS python-builder

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


FROM python:3.12.8-slim-bookworm

# Copy local code to the container image.
ENV PYTHONWARNINGS ignore
ENV PYTHONUNBUFFERED 1

WORKDIR /web-processor

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib

COPY service.py web_processor_cli.py ./
COPY web_processor ./web_processor

RUN useradd -ms /bin/bash scanner
USER scanner

CMD ["python3", "service.py"]

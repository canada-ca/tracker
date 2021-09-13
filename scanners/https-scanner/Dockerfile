FROM ubuntu:20.04

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
WORKDIR /https

RUN useradd -ms /bin/bash scanner

RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    build-essential \
    python3-dev

COPY . ./

RUN pip3 install -r requirements.txt

# Get the Mozilla CRLite DB for revocation checks
RUN moz_crlite_query --force-update

USER scanner
# Run the web service on container startup. Using uvicorn, in this case.
CMD ["python3", "tls.py"]

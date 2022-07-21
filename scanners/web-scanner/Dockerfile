FROM rust:1.62.1 AS crlite-builder
RUN cargo install --git https://github.com/mozilla/crlite rust-query-crlite --rev b19e5aa

#===============================================================================================
#===============================================================================================

FROM ubuntu:22.04 AS python-builder

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
WORKDIR /working/install

RUN apt-get update && apt-get install -y  --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-wheel \
    build-essential \
    python3-dev \
    wget

# Required shared library
RUN wget http://security.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1l-1ubuntu1.6_amd64.deb -P /working

COPY requirements.txt /requirements.txt
RUN pip3 install --prefix=/working/install -r /requirements.txt

#===============================================================================================
#===============================================================================================

FROM ubuntu:22.04

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
WORKDIR /https

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3

# Copy rust-query-crlite
COPY --from=crlite-builder /usr/local/cargo/bin/rust-query-crlite /usr/local/bin/rust-query-crlite
# Copy installed python modules
COPY --from=python-builder /working/install /usr
# Copy required shared library
COPY --from=python-builder /working/libssl1.1_1.1.1l-1ubuntu1.6_amd64.deb ./
# Copy local source code
COPY . ./

# Install required shared library
RUN dpkg -i libssl1.1_1.1.1l-1ubuntu1.6_amd64.deb

# Update Mozilla CRLite DB for revocation checks
RUN rust-query-crlite -vvv --update prod x509

RUN useradd -ms /bin/bash scanner
USER scanner
# Run the web service on container startup. Using uvicorn, in this case.
CMD ["python3", "web_scan_cli.py", "canada.ca"]

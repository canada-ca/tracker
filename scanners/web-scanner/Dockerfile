FROM rust:1.84.1-alpine AS crlite-builder
RUN cargo install --git https://github.com/mozilla/crlite rust-query-crlite --rev dcb8a4d --features=rustls/dangerous_configuration

#===============================================================================================
#===============================================================================================

FROM python:3.12.8-alpine AS python-builder

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
WORKDIR /working/install

RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-wheel \
    build-base \
    python3-dev

COPY requirements.txt /requirements.txt
# Install python requirements to /working/install directory for cleaner copy
RUN pip3 install --prefix=/working/install -r /requirements.txt

#===============================================================================================
#===============================================================================================

FROM python:3.12.8-alpine

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
WORKDIR /web-scanner

# Copy rust-query-crlite
COPY --from=crlite-builder /usr/local/cargo/bin/rust-query-crlite /usr/local/bin/rust-query-crlite
# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy local source code
COPY service.py web_scan_cli.py ./
COPY scan ./scan

# Update Mozilla CRLite DB for revocation checks
RUN rust-query-crlite -vvv --update prod x509

RUN adduser -D scanner
USER scanner

CMD ["python3", "service.py"]

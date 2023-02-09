FROM rust:1.62.1 AS crlite-builder
RUN cargo install --git https://github.com/mozilla/crlite rust-query-crlite --rev b19e5aa

#===============================================================================================
#===============================================================================================

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

# Copy rust-query-crlite
COPY --from=crlite-builder /usr/local/cargo/bin/rust-query-crlite /usr/local/bin/rust-query-crlite

# Update Mozilla CRLite DB for revocation checks
RUN rust-query-crlite -vvv --update prod x509

USER scanner

# Run the web service on container startup. Using uvicorn, in this case.
CMD ["python3", "tls.py"]

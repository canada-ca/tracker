ARG BASE=mcr.microsoft.com/devcontainers/python:3.14-bookworm

#===============================================================================================
# uv

FROM ghcr.io/astral-sh/uv:0.12.23 AS uv

#===============================================================================================
# Web Scanner CRLite

FROM rust:1-bookworm AS crlite
ARG CRLITE_TAG=v1.0.39
RUN cargo install --git https://github.com/mozilla/crlite rust-query-crlite --tag ${CRLITE_TAG}

#===============================================================================================
# Web Scanner Experimental SSLyze

FROM ${BASE} AS experimental

ARG NASSL_REF=9c8be2b118700a34bcb2b63c81ec33e736d98168
ARG SSLYZE_REF=5b3f36b5e0b524915580232f463bd639eb30d447

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    perl \
    make \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv --copies /opt/experimental
ENV PATH="/opt/experimental/bin:$PATH"

RUN pip install --no-cache-dir setuptools invoke

RUN git clone -q https://github.com/nabla-c0d3/nassl.git /build/nassl \
    && git -C /build/nassl checkout -q ${NASSL_REF}
WORKDIR /build/nassl

RUN sed -i 's|https://www.zlib.net/fossils/zlib-\([0-9.]*\)\.tar\.gz|https://github.com/madler/zlib/releases/download/v\1/zlib-\1.tar.gz|' build_config.py \
    && grep -q 'github.com/madler/zlib/releases' build_config.py

RUN MAKEFLAGS="-j$(nproc)" invoke build.all
RUN pip install --no-cache-dir --no-build-isolation .

RUN pip install --no-cache-dir "sslyze @ git+https://github.com/nabla-c0d3/sslyze@${SSLYZE_REF}"

RUN /opt/experimental/bin/python -c "\
import nassl; \
from nassl.openssl_1_0_2 import _nassl as ossl_1_0_2; \
from nassl.openssl_1_1_1 import _nassl as ossl_1_1_1; \
from nassl.openssl_4_0_0 import _nassl as ossl_4_0_0; \
from sslyze.plugins.scan_commands import ScanCommand; \
assert nassl.__version__.startswith('7.'), nassl.__version__; \
ScanCommand.PQ_KEY_EXCHANGE"

RUN printf '{"nassl_commit": "%s", "sslyze_commit": "%s"}\n' "${NASSL_REF}" "${SSLYZE_REF}" \
    > /opt/experimental/build_refs.json

#===============================================================================================
# Dev Container

FROM ${BASE}

ARG TARGETARCH
ARG FINDOMAIN_VERSION=10.0.1
ARG NATS_CLI_VERSION=0.5.0

ENV UV_LINK_MODE=copy

COPY --from=uv /uv /uvx /usr/local/bin/
COPY --from=crlite /usr/local/cargo/bin/rust-query-crlite /usr/local/bin/rust-query-crlite
COPY --from=experimental /opt/experimental /opt/experimental

# Domain Discovery findomain
RUN case "${TARGETARCH}" in \
      amd64) findomain_zip=findomain-linux.zip ;; \
      arm64) findomain_zip=findomain-aarch64.zip ;; \
      *) echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
    esac \
    && curl -fsSL -o /tmp/findomain.zip \
      "https://github.com/findomain/findomain/releases/download/${FINDOMAIN_VERSION}/${findomain_zip}" \
    && unzip -q /tmp/findomain.zip findomain -d /usr/local/bin \
    && chmod +x /usr/local/bin/findomain \
    && rm /tmp/findomain.zip

# NATS CLI
RUN curl -fsSL -o /tmp/nats.zip \
      "https://github.com/nats-io/natscli/releases/download/v${NATS_CLI_VERSION}/nats-${NATS_CLI_VERSION}-linux-${TARGETARCH}.zip" \
    && unzip -q -j /tmp/nats.zip '*/nats' -d /usr/local/bin \
    && rm /tmp/nats.zip

FROM rust:1-bookworm AS crlite-builder
RUN cargo install --git https://github.com/mozilla/crlite rust-query-crlite --tag v1.0.39

#===============================================================================================
#===============================================================================================

FROM python:3.15.0b3-slim-bookworm AS python-builder

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
    python3-dev

COPY requirements.txt /requirements.txt
# Install python requirements to /working/install directory for cleaner copy
RUN pip3 install --prefix=/working/install -r /requirements.txt

#===============================================================================================
#===============================================================================================
# A self-contained venv with dev versions of nassl and sslyze that enable the PQC plugin. Kept
# isolated from the prod interpreter and invoked as a subprocess by pqc_scanner.py for the PQC scan.

FROM python:3.15.0b3-slim-bookworm AS experimental-builder

# Pinned to explicit dev branch commits which enable the PQC plugin.
ARG NASSL_REF=9c8be2b118700a34bcb2b63c81ec33e736d98168
ARG SSLYZE_REF=5b3f36b5e0b524915580232f463bd639eb30d447

ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
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

RUN MAKEFLAGS="-j$(nproc)" invoke build.all
RUN pip install --no-cache-dir --no-build-isolation .

RUN pip install --no-cache-dir "sslyze @ git+https://github.com/nabla-c0d3/sslyze@${SSLYZE_REF}"

# Smoke test is run in the experimental venv to ensure the environment was built correctly.
RUN /opt/experimental/bin/python -c "\
import nassl; \
from nassl.openssl_1_0_2 import _nassl as ossl_1_0_2; \
from nassl.openssl_1_1_1 import _nassl as ossl_1_1_1; \
from nassl.openssl_4_0_0 import _nassl as ossl_4_0_0; \
from sslyze.plugins.scan_commands import ScanCommand; \
assert nassl.__version__.startswith('7.'), nassl.__version__; \
ScanCommand.PQ_KEY_EXCHANGE"

# Record the nassl and sslyze commit hashes used to build the experimental environment.
RUN printf '{"nassl_commit": "%s", "sslyze_commit": "%s"}\n' "${NASSL_REF}" "${SSLYZE_REF}" \
    > /opt/experimental/build_refs.json

#===============================================================================================
#===============================================================================================

FROM python:3.15.0b3-slim-bookworm

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
WORKDIR /web-scanner

# Copy rust-query-crlite
COPY --from=crlite-builder /usr/local/cargo/bin/rust-query-crlite /usr/local/bin/rust-query-crlite
# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy the experimental sslyze/nassl venv. This must not be on the prod interpreter's sys.path.
COPY --from=experimental-builder /opt/experimental /opt/experimental
# Copy local source code
COPY service.py web_scan_cli.py ./
COPY scan ./scan

# Update Mozilla CRLite DB for revocation checks
RUN rust-query-crlite -vvv --update prod x509

RUN useradd -ms /bin/bash scanner
USER scanner

CMD ["python3", "service.py"]

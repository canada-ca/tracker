FROM python:3.14.2-alpine AS python-builder

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

WORKDIR /working/install

RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-setuptools \
    py3-wheel \
    build-base \
    python3-dev \
    curl \
    unzip

COPY requirements.txt /requirements.txt
# Install python requirements to /working/install directory for cleaner copy
RUN pip3 install --prefix=/working/install -r /requirements.txt

# Install findomain
RUN curl -LO https://github.com/findomain/findomain/releases/latest/download/findomain-linux.zip && \
    unzip findomain-linux.zip && \
    chmod +x findomain && \
    mv findomain /usr/bin/findomain

#===============================================================================================
#===============================================================================================

FROM python:3.14.2-alpine

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

WORKDIR /domain-discovery

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy findomain binary
COPY --from=python-builder /usr/bin/findomain /usr/bin/findomain

COPY domain_discovery.py ./

RUN adduser -D discovery
USER discovery

CMD ["python3", "domain_discovery.py"]

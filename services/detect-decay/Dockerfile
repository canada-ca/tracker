ARG PYTHON_VERSION=3.14.3-alpine

FROM python:${PYTHON_VERSION} AS python-builder

ENV PYTHONWARNINGS ignore
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
WORKDIR /working/install

RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-setuptools \
    py3-wheel \
    build-base \
    python3-dev

COPY requirements.txt ./requirements.txt
# Install python requirements to /working/install directory for cleaner copy
RUN pip3 install --prefix=/working/install -r ./requirements.txt

#===============================================================================================
#===============================================================================================

FROM python-builder AS ci

WORKDIR /decay
COPY . .

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib

#===============================================================================================
#===============================================================================================

FROM python:${PYTHON_VERSION}

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
ENV PYTHONDONTWRITEBYTECODE 1
WORKDIR /decay

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy local source code
COPY detect_decay.py ./
COPY config.py ./
COPY notify /decay/notify

RUN adduser -D decay
USER decay

CMD ["python3", "detect_decay.py"]

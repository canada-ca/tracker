FROM python:3.14.3-alpine AS base

# ===============================================================================================

FROM base AS python-builder

# Copy local code to the container image.
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

# ===============================================================================================

FROM python-builder AS ci

WORKDIR /cvd-enrollment
COPY . .

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib

# ===============================================================================================

FROM base AS release

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
ENV PYTHONDONTWRITEBYTECODE 1
WORKDIR /cvd-enrollment

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy local source code
COPY hackerone.py main.py ./

RUN adduser -D enrollment
USER enrollment

CMD ["python3", "main.py"]

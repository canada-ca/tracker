FROM python:3.15.0a8-alpine AS python-builder

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
    python3-dev

COPY requirements.txt /requirements.txt
# Install python requirements to /working/install directory for cleaner copy
RUN pip3 install --prefix=/working/install -r /requirements.txt

#===============================================================================================
#===============================================================================================

FROM python:3.15.0a8-alpine

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

WORKDIR /label-known-easm-assets

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib

COPY service.py ./
COPY clients ./clients

RUN adduser -D defender
USER defender

CMD ["python3", "service.py"]

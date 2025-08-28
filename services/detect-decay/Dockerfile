FROM python:3.13.3-slim-bookworm AS python-builder

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV DEBIAN_FRONTEND noninteractive
WORKDIR /working/install

RUN apt-get update && apt-get install -y --no-install-recommends \
  apt-utils \
  python3 \
  python3-pip \
  python3-setuptools \
  python3-wheel \
  build-essential \
  python3-dev

COPY requirements.txt /requirements.txt
# Install python requirements to /working/install directory for cleaner copy
RUN pip3 install --prefix=/working/install -r /requirements.txt

#===============================================================================================
#===============================================================================================

FROM python:3.13.3-slim-bookworm

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV DEBIAN_FRONTEND noninteractive
WORKDIR /decay

COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy local source code
COPY detect_decay.py ./
COPY notify ./
COPY config.py ./

RUN useradd -ms /bin/bash decay
USER decay

CMD ["python3", "detect_decay.py"]

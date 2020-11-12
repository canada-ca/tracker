FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /autoscan
WORKDIR $HOME
COPY . ./

RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    build-essential \
    python3-dev

# Install dependencies.
RUN pip3 install -r requirements.txt

RUN chmod +x docker-entrypoint.sh

RUN useradd -r -u 1001 autoscan
USER autoscan

CMD exec ~/./docker-entrypoint.sh

FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /autoscan
WORKDIR $HOME
COPY . ./

RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils && \
apt-get install -y --no-install-recommends python3 python3-pip && \
apt-get install -y --no-install-recommends python3-setuptools python3-wheel && \
apt-get install -y --no-install-recommends build-essential python3-dev

# Install dependencies.
RUN pip3 install -r requirements.txt

RUN chmod +x docker-entrypoint.sh

RUN useradd -r -u 1001 autoscan
USER autoscan

CMD exec ~/./docker-entrypoint.sh

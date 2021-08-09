FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /queue
WORKDIR $HOME
COPY . ./

RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    python3-dev \
    redis-server 

RUN pip3 install -r requirements.txt

CMD ["/usr/local/bin/supervisord", "-c", "supervisord.conf"]

FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /queue
WORKDIR $HOME
COPY . ./

RUN chmod +x docker-entrypoint.sh && touch redis-server.log

RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils && \
apt-get install -y --no-install-recommends python3 python3-pip && \
apt-get install -y --no-install-recommends python3-setuptools python3-wheel && \
apt-get install -y --no-install-recommends build-essential python3-dev redis-server systemd

RUN pip3 install -r requirements.txt
RUN sed -i 's/\/var\/log\/redis\/redis-server\.log/\"\"/g' /etc/redis/redis.conf

CMD exec ~/./docker-entrypoint.sh

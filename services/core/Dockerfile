FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /core
WORKDIR $HOME
COPY . ./

RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils git && \
apt-get install -y --no-install-recommends python3 python3-pip && \
apt-get install -y --no-install-recommends python3-setuptools python3-wheel && \
apt-get install -y --no-install-recommends build-essential python3-dev

# Install dependencies.
RUN pip3 install --pre -r requirements.txt

CMD ["python3", "core.py"]

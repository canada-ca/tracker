FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /autoscan
WORKDIR $HOME
COPY . ./

RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils && \
apt-get install -y --no-install-recommends python3 python3-pip && \
apt-get install -y --no-install-recommends python3-setuptools python3-wheel

# Install dependencies.
RUN python3 -m pip install -r requirements.txt

RUN chmod +x autoscan.py
RUN useradd -r -u 1001 autoscan
USER autoscan

ENTRYPOINT ["python3", "autoscan.py"]

FROM ubuntu:20.04

# Copy local code to the container image.
ENV SCANNER_HOME /dmarc
WORKDIR $SCANNER_HOME
COPY . ./

RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils && \
apt-get install -y --no-install-recommends python3 python3-pip && \
apt-get install -y --no-install-recommends python3-setuptools python3-wheel

RUN python3 -m pip install -r requirements.txt

# Run the web service on container startup. Using uvicorn, in this case.
CMD exec uvicorn dmarc_scanner:app

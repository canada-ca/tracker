FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /results
WORKDIR $HOME
COPY . ./

RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils && \
apt-get install -y --no-install-recommends python3 python3-pip && \
apt-get install -y --no-install-recommends python3-setuptools python3-wheel && \
apt-get install -y --no-install-recommends build-essential python3-dev libpq-dev

# Install dependencies.
RUN pip3 install -r requirements.txt

# Run the web service on container startup. Using uvicorn, in this case.
CMD exec gunicorn result_processor:app -w 1 --timeout 1000 -k uvicorn.workers.UvicornWorker

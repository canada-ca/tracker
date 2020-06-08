FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /dispatcher
WORKDIR $HOME
COPY . ./

RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils && \
apt-get install -y --no-install-recommends python3 python3-pip && \
apt-get install -y --no-install-recommends python3-setuptools python3-wheel

# Install dependencies.
RUN python3 -m pip install -r requirements.txt

# Run the web service on container startup. Using uvicorn, in this case.
CMD exec gunicorn dispatcher:app -w 4 -k uvicorn.workers.UvicornWorker

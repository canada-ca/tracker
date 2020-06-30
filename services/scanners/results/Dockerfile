FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /results
WORKDIR $HOME
COPY . ./

RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils && \
apt-get install -y --no-install-recommends python3 python3-pip && \
apt-get install -y --no-install-recommends python3-setuptools python3-wheel

# Install dependencies.
RUN python3 -m pip install -r requirements.txt

# Run the web service on container startup. Using uvicorn, in this case.
CMD exec gunicorn result_processor:app -w 8 --threads 4 --timeout 60 -k uvicorn.workers.UvicornWorker

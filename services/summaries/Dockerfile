FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /summaries
WORKDIR $HOME
COPY . ./

RUN apt-get update
RUN apt-get install -y --no-install-recommends \
  apt-utils \
  git \
  python3 \
  python3-pip \
  python3-setuptools \
  python3-wheel \
  build-essential \
  python3-dev

# Install dependencies.
RUN pip3 install --pre -r requirements.txt

CMD ["python3", "summaries.py"]

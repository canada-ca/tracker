FROM ubuntu:21.04

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
WORKDIR /tls

RUN useradd -ms /bin/bash scanner

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    build-essential \
    python3-dev

COPY . .

# The "no-deps" option here is to work around a pip issue. Poetry has already
# done the dependency resolution, so pip should just install what is specified.
# https://github.com/python-poetry/poetry/issues/3472#issuecomment-973170415
RUN pip3 install --no-deps -r requirements.txt

USER scanner
# Run the web service on container startup. Using uvicorn, in this case.
CMD ["python3", "service.py"]

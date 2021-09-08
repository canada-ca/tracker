FROM ubuntu:21.04

ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

RUN useradd -ms /bin/bash processor
# Copy local code to the container image.
WORKDIR /results

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    build-essential \
    python3-dev

COPY . .

# Install dependencies.
RUN pip3 install -r requirements.txt
USER processor

# Run the web service on container startup. Using uvicorn, in this case.
CMD ["python3", "https_processor.py"]

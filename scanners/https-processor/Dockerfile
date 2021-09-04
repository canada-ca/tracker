FROM ubuntu:20.04

RUN useradd -ms /bin/bash processor
# Copy local code to the container image.
WORKDIR /results

RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-utils \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    build-essential \
    python3-dev \
    libpq-dev

COPY . ./

# Install dependencies.
RUN pip3 install -r requirements.txt
USER processor

# Run the web service on container startup. Using uvicorn, in this case.
CMD ["python3", "https_processor.py"]

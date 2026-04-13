FROM python:3.14.3-alpine AS python-builder

ENV PYTHONWARNINGS ignore
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
WORKDIR /working/install

RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-setuptools \
    py3-wheel \
    build-base \
    python3-dev

COPY requirements.txt ./requirements.txt
# Install python requirements to /working/install directory for cleaner copy
RUN pip3 install --prefix=/working/install -r ./requirements.txt

#===============================================================================================
#===============================================================================================

FROM python-builder AS ci

WORKDIR /home/summaries
COPY . .

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib

RUN pip3 install pytest

#===============================================================================================
#===============================================================================================

FROM python:3.14.3-alpine

# Copy local code to the container image.
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore
ENV PYTHONDONTWRITEBYTECODE 1
WORKDIR /home/summaries

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy local source code
COPY summaries.py ./

RUN adduser -D summary
USER summary

CMD ["python3", "summaries.py"]

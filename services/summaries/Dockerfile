FROM python:3.14.0-slim-bookworm

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV DEBIAN_FRONTEND noninteractive

RUN useradd -ms /bin/bash summary

WORKDIR /home/summaries

RUN apt-get update && apt-get install -y --no-install-recommends \
  apt-utils \
  python3 \
  python3-pip \
  python3-setuptools \
  python3-wheel \
  build-essential \
  python3-dev

COPY . .

USER summary
#
# Install dependencies.
RUN pip3 install --no-cache-dir --pre -r requirements.txt

CMD ["python3", "summaries.py"]

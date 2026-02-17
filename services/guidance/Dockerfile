FROM python:3.14.2-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

RUN useradd -ms /bin/bash guidance

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  apt-utils \
  git \
  python3 \
  python3-pip \
  python3-setuptools \
  python3-wheel \
  build-essential \
  python3-dev

USER guidance
WORKDIR /home/guidance

COPY . .
# Install dependencies.
RUN pip3 install --no-cache-dir --pre -r requirements.txt

CMD ["python3", "guidance.py"]

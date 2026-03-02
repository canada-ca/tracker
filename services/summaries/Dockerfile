FROM python:3.14.2-alpine

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV DEBIAN_FRONTEND noninteractive

RUN adduser -D summary

WORKDIR /home/summaries

RUN apk add --no-cache \
  python3 \
  py3-pip \
  py3-setuptools \
  py3-wheel \
  build-base \
  python3-dev

COPY . .

USER summary
#
# Install dependencies.
RUN pip3 install --no-cache-dir --pre -r requirements.txt

CMD ["python3", "summaries.py"]

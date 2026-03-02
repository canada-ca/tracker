FROM python:3.14.2-alpine

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

RUN adduser -D guidance

RUN apk add --no-cache \
  git \
  python3 \
  py3-pip \
  py3-setuptools \
  py3-wheel \
  build-base \
  python3-dev

USER guidance
WORKDIR /home/guidance

COPY . .
# Install dependencies.
RUN pip3 install --no-cache-dir --pre -r requirements.txt

CMD ["python3", "guidance.py"]

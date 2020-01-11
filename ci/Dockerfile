FROM python:3.6-alpine

# Python, don't write bytecode!
ENV PYTHONDONTWRITEBYTECODE 1

RUN apk add --no-cache openssl-dev libffi-dev build-base
RUN pip install pipenv

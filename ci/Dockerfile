FROM python:3.6-alpine

# Python, don't write bytecode!
ENV PYTHONDONTWRITEBYTECODE 1

RUN apk add -U --no-cache openssl-dev libffi-dev build-base postgresql-libs postgresql-dev musl-dev python3 python3-dev
RUN pip install pipenv

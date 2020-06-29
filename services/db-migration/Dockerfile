FROM alpine

RUN apk update && apk add --no-cache \
python3-dev py3-pip gcc musl-dev postgresql-dev postgresql-contrib bash

COPY . /app

WORKDIR /app

# Install dependencies.
RUN python3 -m pip install -r requirements.txt

CMD ["alembic","--config=/migrations/alembic.ini", "upgrade", "head"]

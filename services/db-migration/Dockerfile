FROM alpine:3.12.0

RUN apk update && apk add --no-cache \
python3-dev py3-pip gcc musl-dev postgresql-dev postgresql-contrib bash

COPY . ./

# Install dependencies.
RUN python3 -m pip install -r requirements.txt

RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]

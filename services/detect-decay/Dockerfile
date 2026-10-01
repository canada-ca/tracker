FROM python:3.14.2-alpine AS base
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV DEBIAN_FRONTEND noninteractive

#===============================================================================================

FROM base AS python-builder

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

FROM base AS production

WORKDIR /decay

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy local source code
COPY detect_decay.py config.py ./
COPY notify /decay/notify

RUN adduser -D decay
USER decay

CMD ["python3", "detect_decay.py"]

#===============================================================================================

FROM production AS test

# Copy test files (which were excluded from production)
COPY . .
USER decay

#===============================================================================================

FROM production AS final

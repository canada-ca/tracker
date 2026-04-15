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
# Install dependencies.
RUN pip3 install --prefix=/working/install --no-cache-dir --pre -r requirements.txt

#===============================================================================================

FROM base AS production

WORKDIR /home/summaries

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy local source code
COPY . .

RUN adduser -D summary
USER summary

CMD ["python3", "summaries.py"]

#===============================================================================================

FROM production AS test

# Copy test files
USER summary

#===============================================================================================

FROM production AS final

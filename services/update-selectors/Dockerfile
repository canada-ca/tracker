FROM python:3.14.3-alpine AS base
ENV PYTHONUNBUFFERED 1
ENV PYTHONWARNINGS ignore

#===============================================================================================

FROM base AS python-builder

# Copy local code to the container image.
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

WORKDIR /selectors

# Copy installed python modules
COPY --from=python-builder /working/install/lib /usr/local/lib
# Copy local source code
COPY update_selectors.py main.py ./

RUN adduser -D selectors
USER selectors

CMD ["python3", "main.py"]

#===============================================================================================

FROM production AS test

# Copy test files (which were excluded from release)
COPY . .
USER selectors

#===============================================================================================

FROM production AS final

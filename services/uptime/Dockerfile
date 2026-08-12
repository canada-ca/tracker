FROM python:3.14.3-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY sync-gatus-config.py .

USER 1000:1000

ENTRYPOINT ["python", "/app/sync-gatus-config.py"]

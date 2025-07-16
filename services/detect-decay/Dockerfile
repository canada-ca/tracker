FROM python:3.11-slim
ENV PYTHONPATH=/app

WORKDIR /app

COPY . .

# Dependencies
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "detect_decay.py"]

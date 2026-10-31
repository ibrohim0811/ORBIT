FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# To'g'ridan-to'g'ri app papkasining ichiga kiramiz
WORKDIR /app/app

# Uvicorn o'rniga python main.py ni ishlatamiz (import muammosini 100% yo'qotadi)
CMD ["python", "main.py"]
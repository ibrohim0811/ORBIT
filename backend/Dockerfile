FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ilova papkasi ichida ishga tushadi (importlar shu yo'nalishda)
WORKDIR /app/app
CMD ["python", "main.py"]

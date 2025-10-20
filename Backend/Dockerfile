# ===== STAGE 1: BUILD =====
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# ===== STAGE 2: RUNTIME =====
FROM python:3.11-slim

WORKDIR /app

# Copy dependencies from build stage (giảm cực mạnh kích thước image)
COPY --from=builder /usr/local /usr/local
COPY --from=builder /app /app

# Chỉ đây mới là lúc truyền SECRET / CORS / PORT (runtime, safe)
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio", "--lifespan", "on"]

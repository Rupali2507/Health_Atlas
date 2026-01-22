# Use Python 3.10 slim image (matching your original)
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing .pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DEFAULT_TIMEOUT=200 \
    PIP_RETRIES=5 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies needed for Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip with retry logic
RUN pip install --upgrade pip setuptools wheel || \
    pip install --upgrade pip setuptools wheel

# Copy requirements first (for Docker layer caching)
COPY requirements.txt .

# Install Python dependencies with increased timeout and retry logic
# First attempt with normal timeout
RUN pip install --timeout=200 --retries=5 -r requirements.txt || \
    # Retry with longer timeout if first attempt fails
    pip install --timeout=300 --retries=10 -r requirements.txt || \
    # Last resort: install critical packages individually
    (pip install fastapi uvicorn python-dotenv && \
     pip install --timeout=300 -r requirements.txt)

# Copy application code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash ocr && \
    chown -R ocr:ocr /app

# Copy application code
COPY app.py .

# Create directories for EasyOCR models
RUN mkdir -p /home/ocr/.EasyOCR && \
    chown -R ocr:ocr /home/ocr/.EasyOCR

# Switch to non-root user
USER ocr

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV OCR_HOST=0.0.0.0
ENV OCR_PORT=8080
ENV USE_GPU=false
ENV FLASK_DEBUG=false

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/health', timeout=5)"

# Use gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--threads", "4", "--timeout", "120", "--keep-alive", "2", "app:app"]
#!/bin/bash
set -e

echo "🚀 Starting AI Marker Backend Services..."

# Navigate to the OCR service directory
cd ocr-service

# --- The Magic Step ---
# If the venv doesn't exist, unpack it from our pre-built archive.
if [ ! -d "venv" ]; then
    echo "📦 Unpacking pre-built Python environment..."
    tar -xzf venv.tar.gz
    
    # Make the unpacked environment usable on this new machine
    source venv/bin/activate
    venv-relocate
    deactivate
    echo "✅ Environment ready."
fi

# Activate the Python virtual environment
source venv/bin/activate

# Start the Gunicorn server in the background
echo "🐍 Starting Gunicorn server on port 8080..."
python3 -m gunicorn --bind 0.0.0.0:8080 --workers 2 app:app &
GUNICORN_PID=$!
echo "Gunicorn started with PID: $GUNICORN_PID"

# Cleanup function to stop Gunicorn when the script exits
cleanup() {
    echo "🚨 Shutting down services..."
    kill $GUNICORN_PID
    echo "Gunicorn server stopped."
}
trap cleanup EXIT

# Start the Cloudflare Tunnel in the foreground
echo "🚇 Starting Cloudflare Tunnel..."
./cloudflared tunnel --config ocr-tunnel-config.yml run aimarker-ocr-tunnel
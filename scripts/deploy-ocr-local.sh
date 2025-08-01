#!/bin/bash
# Deploy OCR Service locally without sudo
# This script sets up OCR service in user space

set -e

echo "🔐 Deploying TrOCR Service locally for AI Marker"
echo "==============================================="

# Create local directories
echo "📁 Setting up local directories..."
mkdir -p ~/.aimarker-ocr/{app,logs,data}
mkdir -p ~/.config/aimarker-ocr

# Copy TrOCR service files
echo "📋 Copying TrOCR service files..."
cp -r ocr-service/* ~/.aimarker-ocr/app/

# Set up Python environment
echo "🐍 Setting up Python environment..."
cd ~/.aimarker-ocr/app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create a simple startup script
echo "📝 Creating startup script..."
cat > ~/.aimarker-ocr/start-ocr.sh << 'EOF'
#!/bin/bash
cd ~/.aimarker-ocr/app
source venv/bin/activate
export FLASK_ENV=production
export USE_GPU=false
export OCR_LOG_LEVEL=INFO
python app.py
EOF

chmod +x ~/.aimarker-ocr/start-ocr.sh

echo ""
echo "✅ Local TrOCR Service setup complete!"
echo ""
echo "📋 To run the OCR service:"
echo "   ~/.aimarker-ocr/start-ocr.sh"
echo ""
echo "🌐 The service will be available at: http://localhost:5000"
echo ""
echo "🔒 Note: This local setup doesn't include:"
echo "   - Cloudflare Tunnel (requires authentication)"
echo "   - System service management"
echo "   - Advanced security hardening"
echo ""
echo "For production deployment, you'll need sudo access or container deployment."
#!/bin/bash
# Deploy OCR Service with Cloudflare Tunnel Security
# This script sets up a secure, privacy-compliant OCR service

set -e

echo "🔐 Deploying Secure TrOCR Service for AI Marker"
echo "==============================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Create TrOCR service user
echo "👤 Creating TrOCR service user..."
sudo useradd -r -s /bin/false -d /opt/aimarker-ocr -m ocr-service || echo "User already exists"

# Create required directories
echo "📁 Setting up directories..."
sudo mkdir -p /opt/aimarker-ocr/{app,logs,data}
sudo mkdir -p /etc/aimarker-ocr
sudo mkdir -p /var/log/cloudflared

# Copy TrOCR service files
echo "📋 Copying TrOCR service files..."
sudo cp -r ocr-service/* /opt/aimarker-ocr/app/
sudo cp ocr-tunnel-config.yml /etc/aimarker-ocr/

# Set up Python environment
echo "🐍 Setting up Python environment..."
cd /opt/aimarker-ocr/app
sudo python3 -m venv venv
sudo chown -R ocr-service:ocr-service /opt/aimarker-ocr
sudo -u ocr-service ./venv/bin/pip install -r requirements.txt

# Create OCR service systemd unit
echo "⚙️  Creating OCR service..."
sudo tee /etc/systemd/system/aimarker-ocr.service > /dev/null << 'EOF'
[Unit]
Description=AI Marker TrOCR Service
After=network.target
Requires=network.target

[Service]
Type=exec
User=ocr-service
Group=ocr-service
WorkingDirectory=/opt/aimarker-ocr/app
Environment=FLASK_ENV=production
Environment=PYTHONPATH=/opt/aimarker-ocr/app
Environment=USE_GPU=false
Environment=OCR_LOG_LEVEL=INFO
ExecStart=/opt/aimarker-ocr/app/venv/bin/python app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=aimarker-ocr

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/aimarker-ocr/logs /tmp
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictRealtime=true
RestrictNamespaces=true
LockPersonality=true
MemoryDenyWriteExecute=true
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM

[Install]
WantedBy=multi-user.target
EOF

# Install Cloudflare Tunnel
echo "☁️  Installing Cloudflare Tunnel..."
if ! command -v cloudflared &> /dev/null; then
    # Download and install cloudflared
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
fi

# Create Cloudflare Tunnel systemd unit
echo "🚇 Setting up Cloudflare Tunnel service..."
sudo tee /etc/systemd/system/cloudflared-ocr.service > /dev/null << 'EOF'
[Unit]
Description=Cloudflare Tunnel for AI Marker OCR
After=network.target aimarker-ocr.service
Requires=network.target

[Service]
Type=exec
User=ocr-service
Group=ocr-service
ExecStart=/usr/local/bin/cloudflared tunnel --config /etc/aimarker-ocr/ocr-tunnel-config.yml run
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cloudflared-ocr

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictRealtime=true
LockPersonality=true

[Install]
WantedBy=multi-user.target
EOF

# Set up firewall rules
echo "🔥 Configuring firewall..."
sudo ufw allow from 127.0.0.1 to any port 5000 comment "OCR service local only"
sudo ufw deny 5000 comment "Block external OCR access"

# Create log rotation
echo "🔄 Setting up log rotation..."
sudo tee /etc/logrotate.d/aimarker-ocr > /dev/null << 'EOF'
/opt/aimarker-ocr/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ocr-service ocr-service
    postrotate
        systemctl reload aimarker-ocr || true
    endscript
}

/var/log/cloudflared/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ocr-service ocr-service
}
EOF

# Set file permissions
echo "🔐 Setting secure file permissions..."
sudo chown -R ocr-service:ocr-service /opt/aimarker-ocr
sudo chown ocr-service:ocr-service /etc/aimarker-ocr/ocr-tunnel-config.yml
sudo chmod 600 /etc/aimarker-ocr/ocr-tunnel-config.yml
sudo chmod -R 755 /opt/aimarker-ocr/app
sudo chmod -R 750 /opt/aimarker-ocr/logs

# Reload systemd and enable services
echo "🔄 Enabling services..."
sudo systemctl daemon-reload
sudo systemctl enable aimarker-ocr
sudo systemctl enable cloudflared-ocr

echo ""
echo "✅ TrOCR Service deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up Cloudflare Tunnel credentials:"
echo "   cloudflared tunnel login"
echo "   cloudflared tunnel create aimarker-ocr-tunnel"
echo "   cloudflared tunnel route dns aimarker-ocr-tunnel ocr-internal.aimarker.com"
echo ""
echo "2. Configure Cloudflare Access for OCR Tunnel Security:"
echo "   a) Go to Cloudflare Dashboard > Zero Trust > Access > Applications"
echo "   b) Create new application:"
echo "      - Type: Self-hosted"
echo "      - Name: AI Marker OCR Service"
echo "      - Domain: ocr-internal.aimarker.com"
echo "      - Policy: Service Token"
echo "   c) Create Service Token:"
echo "      - Name: OCR Service Token"
echo "      - Copy Client ID and Client Secret"
echo ""
echo "3. Update environment variables in Cloudflare Workers:"
echo "   wrangler secret put OCR_SERVICE_ENDPOINT"
echo "   # Value: https://ocr-internal.aimarker.com"
echo "   wrangler secret put OCR_TUNNEL_CLIENT_ID"
echo "   # Value: <your-service-token-client-id>"
echo "   wrangler secret put OCR_TUNNEL_CLIENT_SECRET"
echo "   # Value: <your-service-token-client-secret>"
echo "   wrangler secret put OCR_TUNNEL_TOKEN"
echo "   # Value: <your-bearer-token-for-auth-header>"
echo ""
echo "4. Start services:"
echo "   sudo systemctl start aimarker-ocr"
echo "   sudo systemctl start cloudflared-ocr"
echo ""
echo "5. Check status:"
echo "   sudo systemctl status aimarker-ocr"
echo "   sudo systemctl status cloudflared-ocr"
echo ""
echo "🤖 TrOCR Model Features:"
echo "   - Microsoft TrOCR base handwritten model"
echo "   - Optimized for handwritten text recognition"
echo "   - Enhanced accuracy for student work"
echo "   - GDPR-compliant ephemeral processing"
echo ""
echo "🔒 Security features enabled:"
echo "   - Service runs as non-root user"
echo "   - Systemd security hardening"
echo "   - Cloudflare Tunnel encryption"
echo "   - Firewall protection (local access only)"
echo "   - Log rotation and monitoring"
echo "   - No external network exposure"
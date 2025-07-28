#!/bin/bash

# AIMARKER VM Deployment Script
# This script sets up and deploys the AIMARKER application on a VM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="aimarker"
APP_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/${PROJECT_NAME}/backups"
LOG_FILE="/var/log/${PROJECT_NAME}/deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_FILE}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${LOG_FILE}"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${LOG_FILE}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
    fi
}

# Install Docker and Docker Compose
install_docker() {
    log "Installing Docker and Docker Compose..."
    
    # Update package index
    apt-get update
    
    # Install required packages
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    success "Docker installed successfully"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Install ufw if not present
    apt-get install -y ufw
    
    # Reset firewall rules
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Create application directories
setup_directories() {
    log "Setting up application directories..."
    
    mkdir -p "${APP_DIR}"
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "/var/log/${PROJECT_NAME}"
    mkdir -p "${APP_DIR}/ssl"
    
    # Set proper permissions
    chown -R root:root "${APP_DIR}"
    chmod -R 755 "${APP_DIR}"
    
    success "Directories created"
}

# Setup SSL certificates (placeholder - you'll need to add your own certificates)
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [[ ! -f "${APP_DIR}/ssl/cert.pem" ]] || [[ ! -f "${APP_DIR}/ssl/key.pem" ]]; then
        warning "SSL certificates not found. Creating self-signed certificates for development..."
        
        # Create self-signed certificate (replace with proper certificates in production)
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${APP_DIR}/ssl/key.pem" \
            -out "${APP_DIR}/ssl/cert.pem" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        warning "Self-signed certificates created. Replace with proper SSL certificates for production!"
    fi
    
    success "SSL certificates configured"
}

# Create environment file
create_env_file() {
    log "Creating environment file..."
    
    cat > "${APP_DIR}/.env" << 'EOF'
# Database Configuration
POSTGRES_DB=aimarker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys
GOOGLE_AI_API_KEY=your_google_ai_key
OPENROUTER_API_KEY=your_openrouter_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
DATADOG_CLIENT_TOKEN=your_datadog_token

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
EOF
    
    chmod 600 "${APP_DIR}/.env"
    
    warning "Environment file created with placeholder values. Please update ${APP_DIR}/.env with your actual configuration!"
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    # Copy application files
    cp -r . "${APP_DIR}/"
    
    # Change to app directory
    cd "${APP_DIR}"
    
    # Pull and build images
    docker compose -f docker-compose.prod.yml pull
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    docker compose -f docker-compose.prod.yml up -d
    
    success "Application deployed successfully"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    cat > "${APP_DIR}/backup.sh" << 'EOF'
#!/bin/bash

# AIMARKER Backup Script
BACKUP_DIR="/opt/aimarker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.tar.gz"

# Create backup
docker compose -f /opt/aimarker/docker-compose.prod.yml exec -T postgres pg_dump -U postgres aimarker > "${BACKUP_DIR}/db_${DATE}.sql"
tar -czf "${BACKUP_FILE}" -C /opt/aimarker .env docker-compose.prod.yml nginx.conf "${BACKUP_DIR}/db_${DATE}.sql"

# Remove old backups (keep last 7 days)
find "${BACKUP_DIR}" -name "backup_*.tar.gz" -mtime +7 -delete
find "${BACKUP_DIR}" -name "db_*.sql" -mtime +7 -delete

echo "Backup created: ${BACKUP_FILE}"
EOF
    
    chmod +x "${APP_DIR}/backup.sh"
    
    # Add to crontab for daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * ${APP_DIR}/backup.sh") | crontab -
    
    success "Backup script created and scheduled"
}

# Setup systemd service for auto-restart
setup_systemd_service() {
    log "Setting up systemd service..."
    
    cat > "/etc/systemd/system/${PROJECT_NAME}.service" << EOF
[Unit]
Description=AIMARKER Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable "${PROJECT_NAME}.service"
    
    success "Systemd service created"
}

# Main deployment function
main() {
    log "Starting AIMARKER VM deployment..."
    
    check_root
    install_docker
    setup_firewall
    setup_directories
    setup_ssl
    create_env_file
    deploy_app
    create_backup_script
    setup_systemd_service
    
    success "Deployment completed successfully!"
    
    echo ""
    echo -e "${GREEN}=== DEPLOYMENT SUMMARY ===${NC}"
    echo -e "Application directory: ${APP_DIR}"
    echo -e "Environment file: ${APP_DIR}/.env (${RED}PLEASE UPDATE WITH YOUR VALUES${NC})"
    echo -e "SSL certificates: ${APP_DIR}/ssl/"
    echo -e "Backup directory: ${BACKUP_DIR}"
    echo -e "Log file: ${LOG_FILE}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Update environment variables in ${APP_DIR}/.env"
    echo -e "2. Replace SSL certificates in ${APP_DIR}/ssl/"
    echo -e "3. Restart the application: systemctl restart ${PROJECT_NAME}"
    echo -e "4. Check application status: docker compose -f ${APP_DIR}/docker-compose.prod.yml ps"
    echo ""
}

# Run main function
main "$@"
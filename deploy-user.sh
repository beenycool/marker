#!/bin/bash

# AIMARKER User-Space VM Deployment Script
# This script sets up and deploys the AIMARKER application without root privileges

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="aimarker"
APP_DIR="$HOME/${PROJECT_NAME}"
BACKUP_DIR="$HOME/${PROJECT_NAME}/backups"
LOG_FILE="$HOME/${PROJECT_NAME}/deploy.log"
USER_PORTS_START=8000  # Start from port 8000 for user services

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

# Check if Docker is available
check_docker() {
    log "Checking Docker availability..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first or ask your system administrator."
    fi
    
    # Check if user can run Docker without sudo
    if ! docker ps &> /dev/null; then
        warning "Cannot run Docker without sudo. Trying with sudo..."
        if ! sudo docker ps &> /dev/null; then
            error "Docker is not accessible. Please ensure Docker is installed and your user is in the docker group."
        fi
        DOCKER_CMD="sudo docker"
        DOCKER_COMPOSE_CMD="sudo docker compose"
    else
        DOCKER_CMD="docker"
        DOCKER_COMPOSE_CMD="docker compose"
    fi
    
    success "Docker is available"
}

# Install Docker Compose if not available
install_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log "Installing Docker Compose..."
        
        # Create local bin directory
        mkdir -p "$HOME/.local/bin"
        
        # Download Docker Compose
        DOCKER_COMPOSE_VERSION="v2.24.1"
        curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
             -o "$HOME/.local/bin/docker-compose"
        
        chmod +x "$HOME/.local/bin/docker-compose"
        
        # Add to PATH if not already there
        if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
            export PATH="$HOME/.local/bin:$PATH"
        fi
        
        DOCKER_COMPOSE_CMD="$HOME/.local/bin/docker-compose"
        success "Docker Compose installed"
    else
        success "Docker Compose is available"
    fi
}

# Setup application directories
setup_directories() {
    log "Setting up application directories..."
    
    mkdir -p "${APP_DIR}"
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "$(dirname "${LOG_FILE}")"
    mkdir -p "${APP_DIR}/ssl"
    mkdir -p "${APP_DIR}/data/postgres"
    mkdir -p "${APP_DIR}/data/redis"
    mkdir -p "${APP_DIR}/data/ocr-models"
    
    success "Directories created"
}

# Create self-signed SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [[ ! -f "${APP_DIR}/ssl/cert.pem" ]] || [[ ! -f "${APP_DIR}/ssl/key.pem" ]]; then
        warning "Creating self-signed certificates for development..."
        
        # Check if openssl is available
        if ! command -v openssl &> /dev/null; then
            warning "OpenSSL not found. Downloading a simple certificate..."
            # Create a basic self-signed cert without openssl
            cat > "${APP_DIR}/ssl/cert.pem" << 'EOF'
-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAMlyFqk69v+9MA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNVBAMMCWxv
Y2FsaG9zdDAeFw0yNDAxMDEwMDAwMDBaFw0yNTAxMDEwMDAwMDBaMBQxEjAQBgNV
BAMMCWxvY2FsaG9zdDBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQDTgvwjlRHZ9kz4
EOF
            cat > "${APP_DIR}/ssl/key.pem" << 'EOF'
-----BEGIN PRIVATE KEY-----
MIIBVAIBADANBgkqhkiG9w0BAQEFAASCAT4wggE6AgEAAkEA04L8I5UR2fZM+F4n
EOF
        else
            # Create self-signed certificate with OpenSSL
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "${APP_DIR}/ssl/key.pem" \
                -out "${APP_DIR}/ssl/cert.pem" \
                -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
                2>/dev/null || {
                    warning "Failed to create SSL certificates with OpenSSL, using HTTP only"
                    touch "${APP_DIR}/ssl/cert.pem"
                    touch "${APP_DIR}/ssl/key.pem"
                }
        fi
        
        warning "Self-signed certificates created. Replace with proper SSL certificates for production!"
    fi
    
    success "SSL certificates configured"
}

# Create user-space docker-compose file
create_user_docker_compose() {
    log "Creating user-space Docker Compose configuration..."
    
    cat > "${APP_DIR}/docker-compose.user.yml" << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: ${PROJECT_NAME}_postgres_user
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-aimarker}
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    ports:
      - '${USER_PORTS_START}:5432'
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U \${POSTGRES_USER:-postgres}']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - ${PROJECT_NAME}_network

  redis:
    image: redis:7-alpine
    container_name: ${PROJECT_NAME}_redis_user
    ports:
      - '$((USER_PORTS_START + 1)):6379'
    volumes:
      - ./data/redis:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped
    networks:
      - ${PROJECT_NAME}_network

  ocr:
    build:
      context: ./ocr-service
      dockerfile: Dockerfile
    container_name: ${PROJECT_NAME}_ocr_user
    ports:
      - '$((USER_PORTS_START + 2)):8080'
    environment:
      - OCR_HOST=0.0.0.0
      - OCR_PORT=8080
      - USE_GPU=false
      - FLASK_DEBUG=false
    volumes:
      - ./data/ocr-models:/home/ocr/.EasyOCR
    healthcheck:
      test: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1']
      interval: 30s
      timeout: 10s
      start_period: 60s
      retries: 3
    restart: unless-stopped
    networks:
      - ${PROJECT_NAME}_network

  app:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: ${PROJECT_NAME}_app_user
    ports:
      - '$((USER_PORTS_START + 3)):3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://\${POSTGRES_USER:-postgres}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB:-aimarker}
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_SUPABASE_URL=\${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=\${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}
      - GOOGLE_AI_API_KEY=\${GOOGLE_AI_API_KEY}
      - OPENROUTER_API_KEY=\${OPENROUTER_API_KEY}
      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}
      - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      - SENTRY_DSN=\${SENTRY_DSN}
      - NEXT_PUBLIC_POSTHOG_KEY=\${NEXT_PUBLIC_POSTHOG_KEY}
      - DATADOG_CLIENT_TOKEN=\${DATADOG_CLIENT_TOKEN}
      - NEXT_PUBLIC_APP_URL=\${NEXT_PUBLIC_APP_URL:-http://localhost:$((USER_PORTS_START + 4))}
      - EASYOCR_API_ENDPOINT=http://ocr:8080
      - EASYOCR_API_KEY=\${EASYOCR_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ocr:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ${PROJECT_NAME}_network

  nginx:
    image: nginx:alpine
    container_name: ${PROJECT_NAME}_nginx_user
    ports:
      - '$((USER_PORTS_START + 4)):80'
      - '$((USER_PORTS_START + 5)):443'
    volumes:
      - ./nginx.user.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - ${PROJECT_NAME}_network

networks:
  ${PROJECT_NAME}_network:
    driver: bridge
EOF
    
    success "User-space Docker Compose configuration created"
}

# Create user-space nginx configuration
create_user_nginx_config() {
    log "Creating user-space Nginx configuration..."
    
    cat > "${APP_DIR}/nginx.user.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Basic rate limiting for user deployment
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=20r/s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Basic security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

    server {
        listen 80;
        server_name _;

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # General requests
        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # HTTPS server (if SSL certificates are available)
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;

        # Same proxy configuration as HTTP
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
    
    success "User-space Nginx configuration created"
}

# Create environment file
create_env_file() {
    log "Creating environment file..."
    
    cat > "${APP_DIR}/.env" << 'EOF'
# Database Configuration
POSTGRES_DB=aimarker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_password_123

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys (Required)
OPENROUTER_API_KEY=your_openrouter_key

# Optional Services
GOOGLE_AI_API_KEY=your_google_ai_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
DATADOG_CLIENT_TOKEN=your_datadog_token

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:8004
EASYOCR_API_KEY=optional_ocr_api_key
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
    
    # Build and start services
    log "Building and starting services (this may take several minutes)..."
    ${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml build --no-cache
    ${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml up -d
    
    success "Application deployed successfully"
}

# Create management scripts
create_management_scripts() {
    log "Creating management scripts..."
    
    # Start script
    cat > "${APP_DIR}/start.sh" << EOF
#!/bin/bash
cd "${APP_DIR}"
${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml up -d
echo "AIMARKER started. Access at: http://localhost:$((USER_PORTS_START + 4))"
EOF

    # Stop script
    cat > "${APP_DIR}/stop.sh" << EOF
#!/bin/bash
cd "${APP_DIR}"
${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml down
echo "AIMARKER stopped."
EOF

    # Status script
    cat > "${APP_DIR}/status.sh" << EOF
#!/bin/bash
cd "${APP_DIR}"
${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml ps
EOF

    # Logs script
    cat > "${APP_DIR}/logs.sh" << EOF
#!/bin/bash
cd "${APP_DIR}"
if [ -z "\$1" ]; then
    ${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml logs -f
else
    ${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml logs -f "\$1"
fi
EOF

    # Update script
    cat > "${APP_DIR}/update.sh" << EOF
#!/bin/bash
cd "${APP_DIR}"
${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml down
${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml build --no-cache
${DOCKER_COMPOSE_CMD} -f docker-compose.user.yml up -d
echo "AIMARKER updated and restarted."
EOF

    # Make scripts executable
    chmod +x "${APP_DIR}"/*.sh
    
    success "Management scripts created"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    cat > "${APP_DIR}/backup.sh" << EOF
#!/bin/bash
BACKUP_DIR="${BACKUP_DIR}"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\${BACKUP_DIR}/backup_\${DATE}.tar.gz"

mkdir -p "\${BACKUP_DIR}"

# Create database backup
${DOCKER_COMPOSE_CMD} -f "${APP_DIR}/docker-compose.user.yml" exec -T postgres pg_dump -U postgres aimarker > "\${BACKUP_DIR}/db_\${DATE}.sql"

# Create full backup
tar -czf "\${BACKUP_FILE}" -C "${APP_DIR}" .env docker-compose.user.yml nginx.user.conf "\${BACKUP_DIR}/db_\${DATE}.sql"

# Remove old backups (keep last 7 days)
find "\${BACKUP_DIR}" -name "backup_*.tar.gz" -mtime +7 -delete 2>/dev/null || true
find "\${BACKUP_DIR}" -name "db_*.sql" -mtime +7 -delete 2>/dev/null || true

echo "Backup created: \${BACKUP_FILE}"
EOF
    
    chmod +x "${APP_DIR}/backup.sh"
    
    success "Backup script created"
}

# Display deployment information
show_deployment_info() {
    log "Deployment completed successfully!"
    
    echo ""
    echo -e "${GREEN}=== AIMARKER USER DEPLOYMENT SUMMARY ===${NC}"
    echo -e "Application directory: ${APP_DIR}"
    echo -e "Environment file: ${APP_DIR}/.env (${RED}PLEASE UPDATE WITH YOUR VALUES${NC})"
    echo -e "SSL certificates: ${APP_DIR}/ssl/"
    echo -e "Data directory: ${APP_DIR}/data/"
    echo -e "Backup directory: ${BACKUP_DIR}"
    echo -e "Log file: ${LOG_FILE}"
    echo ""
    echo -e "${BLUE}=== ACCESS INFORMATION ===${NC}"
    echo -e "Web Application: http://localhost:$((USER_PORTS_START + 4))"
    echo -e "HTTPS (if SSL configured): https://localhost:$((USER_PORTS_START + 5))"
    echo -e "PostgreSQL: localhost:${USER_PORTS_START}"
    echo -e "Redis: localhost:$((USER_PORTS_START + 1))"
    echo -e "OCR Service: http://localhost:$((USER_PORTS_START + 2))"
    echo ""
    echo -e "${BLUE}=== MANAGEMENT COMMANDS ===${NC}"
    echo -e "Start services: ${APP_DIR}/start.sh"
    echo -e "Stop services: ${APP_DIR}/stop.sh"
    echo -e "View status: ${APP_DIR}/status.sh"
    echo -e "View logs: ${APP_DIR}/logs.sh [service]"
    echo -e "Update app: ${APP_DIR}/update.sh"
    echo -e "Create backup: ${APP_DIR}/backup.sh"
    echo ""
    echo -e "${YELLOW}=== NEXT STEPS ===${NC}"
    echo -e "1. Update environment variables in ${APP_DIR}/.env"
    echo -e "2. Replace SSL certificates in ${APP_DIR}/ssl/ (for HTTPS)"
    echo -e "3. Restart the application: ${APP_DIR}/stop.sh && ${APP_DIR}/start.sh"
    echo -e "4. Check application status: ${APP_DIR}/status.sh"
    echo ""
    echo -e "${GREEN}Your AIMARKER application is now running at: http://localhost:$((USER_PORTS_START + 4))${NC}"
}

# Main deployment function
main() {
    log "Starting AIMARKER user-space VM deployment..."
    
    check_docker
    install_docker_compose
    setup_directories
    setup_ssl
    create_user_docker_compose
    create_user_nginx_config
    create_env_file
    deploy_app
    create_management_scripts
    create_backup_script
    show_deployment_info
}

# Run main function
main "$@"
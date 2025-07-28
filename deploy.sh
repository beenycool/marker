#!/bin/bash

# AIMARKER No-Sudo Deployment Script
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="aimarker"
APP_DIR="$HOME/${PROJECT_NAME}"

echo -e "${BLUE}Starting AIMARKER deployment (no sudo)...${NC}"

# Create directories first
echo "Creating directories..."
mkdir -p "$APP_DIR"/{ssl,data/{postgres,redis,ocr-models},backups}

# Check Docker access (NO SUDO)
echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker not installed. Please ask your admin to install Docker.${NC}"
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo -e "${RED}ERROR: Cannot access Docker without sudo.${NC}"
    echo -e "${YELLOW}Please ask your admin to add you to the docker group:${NC}"
    echo -e "sudo usermod -aG docker $USER"
    echo -e "Then logout and login again."
    exit 1
fi

DOCKER_CMD="docker"
COMPOSE_CMD="docker compose"

echo -e "${GREEN}Docker is available${NC}"

# Copy files
echo "Copying application files..."
cp -r . "$APP_DIR/"
cd "$APP_DIR"

# Create user docker-compose (with rootless containers)
echo "Creating Docker Compose configuration..."
cat > docker-compose.nosudo.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: aimarker_postgres
    user: "1000:1000"  # Run as current user
    environment:
      POSTGRES_DB: aimarker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme123}
      PGUSER: postgres
    ports:
      - '8000:5432'
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: aimarker_redis
    user: "1000:1000"  # Run as current user
    ports:
      - '8001:6379'
    volumes:
      - ./data/redis:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

  ocr:
    build:
      context: ./ocr-service
      dockerfile: Dockerfile
    container_name: aimarker_ocr
    ports:
      - '8002:8080'
    environment:
      - OCR_HOST=0.0.0.0
      - OCR_PORT=8080
      - USE_GPU=false
    volumes:
      - ./data/ocr-models:/home/ocr/.EasyOCR
    healthcheck:
      test: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1']
      interval: 30s
      timeout: 10s
      start_period: 60s
      retries: 3
    restart: unless-stopped

  app:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: aimarker_app
    ports:
      - '8003:3000'
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - NEXT_PUBLIC_APP_URL=http://localhost:8003
      - EASYOCR_API_ENDPOINT=http://ocr:8080
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ocr:
        condition: service_healthy
    restart: unless-stopped
EOF

# Create environment file
echo "Creating environment file..."
cat > .env << 'EOF'
# Database
POSTGRES_PASSWORD=changeme123

# Supabase (REQUIRED - Update these!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API (REQUIRED - Update this!)
OPENROUTER_API_KEY=your_openrouter_key

# Optional
GOOGLE_AI_API_KEY=your_google_key
STRIPE_SECRET_KEY=your_stripe_key
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
EOF

# Fix permissions for postgres data directory
echo "Setting up permissions..."
chmod 777 data/postgres data/redis data/ocr-models

# Create management scripts
echo "Creating management scripts..."

cat > start.sh << 'EOF'
#!/bin/bash
cd ~/aimarker
docker compose -f docker-compose.nosudo.yml up -d
echo "AIMARKER started at: http://localhost:8003"
EOF

cat > stop.sh << 'EOF'
#!/bin/bash
cd ~/aimarker
docker compose -f docker-compose.nosudo.yml down
EOF

cat > status.sh << 'EOF'
#!/bin/bash
cd ~/aimarker
docker compose -f docker-compose.nosudo.yml ps
EOF

cat > logs.sh << 'EOF'
#!/bin/bash
cd ~/aimarker
docker compose -f docker-compose.nosudo.yml logs -f ${1:-}
EOF

cat > restart.sh << 'EOF'
#!/bin/bash
cd ~/aimarker
docker compose -f docker-compose.nosudo.yml down
docker compose -f docker-compose.nosudo.yml up -d
echo "AIMARKER restarted at: http://localhost:8003"
EOF

chmod +x *.sh

# Deploy
echo -e "${YELLOW}Building and starting services (this will take several minutes)...${NC}"
echo "This may take 5-10 minutes to download and build everything..."

docker compose -f docker-compose.nosudo.yml build
docker compose -f docker-compose.nosudo.yml up -d

echo ""
echo -e "${GREEN}=== DEPLOYMENT COMPLETE ===${NC}"
echo -e "App Directory: $APP_DIR"
echo -e "Access URL: ${GREEN}http://localhost:8003${NC}"
echo ""
echo -e "${RED}CRITICAL: Update your API keys in:${NC}"
echo -e "$APP_DIR/.env"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo -e "$APP_DIR/start.sh    - Start services"
echo -e "$APP_DIR/stop.sh     - Stop services" 
echo -e "$APP_DIR/restart.sh  - Restart services"
echo -e "$APP_DIR/status.sh   - Check status"
echo -e "$APP_DIR/logs.sh     - View logs"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Edit $APP_DIR/.env with your Supabase and OpenRouter API keys"
echo -e "2. Run: $APP_DIR/restart.sh"
echo -e "3. Open: http://localhost:8003"
echo ""
echo -e "${YELLOW}If you see permission errors, your user needs to be in the docker group${NC}"
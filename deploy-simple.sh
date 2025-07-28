#!/bin/bash

# Simple AIMARKER Deployment Script (No sudo required)
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="aimarker"
APP_DIR="$HOME/${PROJECT_NAME}"

echo -e "${BLUE}Starting AIMARKER deployment...${NC}"

# Create directories first
echo "Creating directories..."
mkdir -p "$APP_DIR"/{ssl,data/{postgres,redis,ocr-models},backups}

# Now we can safely create log file
LOG_FILE="$APP_DIR/deploy.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${GREEN}Directories created successfully${NC}"

# Check Docker
echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker not installed${NC}"
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo -e "${YELLOW}Trying Docker with sudo...${NC}"
    if ! sudo docker ps &> /dev/null; then
        echo -e "${RED}ERROR: Cannot access Docker${NC}"
        exit 1
    fi
    DOCKER_CMD="sudo docker"
    COMPOSE_CMD="sudo docker compose"
else
    DOCKER_CMD="docker"
    COMPOSE_CMD="docker compose"
fi

echo -e "${GREEN}Docker is available${NC}"

# Copy files
echo "Copying application files..."
cp -r . "$APP_DIR/"
cd "$APP_DIR"

# Create user docker-compose
echo "Creating Docker Compose configuration..."
cat > docker-compose.user.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: aimarker_postgres
    environment:
      POSTGRES_DB: aimarker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme123}
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

# Create management scripts
echo "Creating management scripts..."

cat > start.sh << EOF
#!/bin/bash
cd "$APP_DIR"
$COMPOSE_CMD -f docker-compose.user.yml up -d
echo "AIMARKER started at: http://localhost:8003"
EOF

cat > stop.sh << EOF
#!/bin/bash
cd "$APP_DIR"
$COMPOSE_CMD -f docker-compose.user.yml down
EOF

cat > status.sh << EOF
#!/bin/bash
cd "$APP_DIR"
$COMPOSE_CMD -f docker-compose.user.yml ps
EOF

cat > logs.sh << EOF
#!/bin/bash
cd "$APP_DIR"
$COMPOSE_CMD -f docker-compose.user.yml logs -f \${1:-}
EOF

chmod +x *.sh

# Deploy
echo -e "${YELLOW}Building and starting services (this will take several minutes)...${NC}"
$COMPOSE_CMD -f docker-compose.user.yml build
$COMPOSE_CMD -f docker-compose.user.yml up -d

echo ""
echo -e "${GREEN}=== DEPLOYMENT COMPLETE ===${NC}"
echo -e "App Directory: $APP_DIR"
echo -e "Access URL: ${GREEN}http://localhost:8003${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Update your API keys in:${NC}"
echo -e "$APP_DIR/.env"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo -e "$APP_DIR/start.sh  - Start services"
echo -e "$APP_DIR/stop.sh   - Stop services" 
echo -e "$APP_DIR/status.sh - Check status"
echo -e "$APP_DIR/logs.sh   - View logs"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Edit $APP_DIR/.env with your API keys"
echo -e "2. Run: $APP_DIR/stop.sh && $APP_DIR/start.sh"
echo -e "3. Open: http://localhost:8003"
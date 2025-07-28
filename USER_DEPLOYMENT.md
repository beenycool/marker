# AIMARKER User-Space Deployment Guide

This guide explains how to deploy AIMARKER on a VM **without root/sudo access** using Docker in user-space.

## Quick Start

### 1. Run the Deployment Script
```bash
./deploy-user.sh
```

This automatically:
- Installs Docker Compose if needed
- Sets up all directories and configurations
- Deploys all services (Next.js app, PostgreSQL, Redis, OCR service)
- Creates management scripts
- Uses ports 8000-8005 (no conflicts with system services)

### 2. Update Configuration
```bash
nano ~/aimarker/.env
```

**Required variables:**
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Service (Required)
OPENROUTER_API_KEY=your_openrouter_key

# Database (Required)
POSTGRES_PASSWORD=secure_password_here
```

### 3. Restart Services
```bash
~/aimarker/stop.sh
~/aimarker/start.sh
```

### 4. Access Your App
- **Web App**: http://localhost:8004
- **HTTPS**: https://localhost:8005 (with SSL)

## Architecture

```
Port 8004 (HTTP/HTTPS) → Nginx → Next.js App (8003)
                              ↓
                         PostgreSQL (8000)
                              ↓  
                         Redis (8001)
                              ↓
                         OCR Service (8002)
```

## EasyOCR Service

The deployment includes a **proper Python EasyOCR service** that:

✅ **Supports 80+ languages** (en, es, fr, de, it, pt, ru, ja, ko, zh, etc.)  
✅ **Handles handwritten and printed text**  
✅ **Returns confidence scores and processing times**  
✅ **Includes image validation and preprocessing**  
✅ **Has health checks and error handling**  
✅ **Runs on dedicated port 8002**  

### OCR API Endpoints:
- `GET /health` - Service health check
- `POST /ocr` - Process image for text extraction
- `GET /languages` - List supported languages

## Management Scripts

All scripts are created in `~/aimarker/`:

```bash
# Service Management
~/aimarker/start.sh      # Start all services
~/aimarker/stop.sh       # Stop all services  
~/aimarker/status.sh     # Check service status
~/aimarker/logs.sh       # View all logs
~/aimarker/logs.sh app   # View specific service logs

# Maintenance
~/aimarker/update.sh     # Update and restart app
~/aimarker/backup.sh     # Create database backup
```

## Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 8000 | Database |
| Redis | 8001 | Caching |
| OCR Service | 8002 | EasyOCR API |
| Next.js App | 8003 | Application |
| Nginx HTTP | 8004 | Web proxy |
| Nginx HTTPS | 8005 | SSL proxy |

## File Structure

```
~/aimarker/
├── .env                      # Environment variables
├── docker-compose.user.yml  # Docker services
├── nginx.user.conf          # Nginx configuration
├── ssl/                     # SSL certificates
├── data/                    # Persistent data
│   ├── postgres/           # Database files
│   ├── redis/              # Redis data
│   └── ocr-models/         # EasyOCR models
├── backups/                # Database backups
├── ocr-service/            # Python OCR service
│   ├── app.py              # Flask OCR API
│   ├── Dockerfile          # OCR container
│   └── requirements.txt    # Python dependencies
└── *.sh                    # Management scripts
```

## Troubleshooting

### Common Issues

**1. Docker Permission Denied**
```bash
# Add user to docker group (requires logout/login)
sudo usermod -aG docker $USER
```

**2. Port Already in Use**
```bash
# Check what's using the ports
netstat -tlnp | grep 800
```

**3. OCR Service Not Starting**
```bash
# Check OCR service logs
~/aimarker/logs.sh ocr
```

**4. Database Connection Issues**
```bash
# Reset database
~/aimarker/stop.sh
rm -rf ~/aimarker/data/postgres/*
~/aimarker/start.sh
```

### Debug Commands

```bash
# Check all container status
~/aimarker/status.sh

# View real-time logs
~/aimarker/logs.sh

# Test OCR service directly
curl http://localhost:8002/health

# Test main app health
curl http://localhost:8004/api/health

# Connect to database
docker exec -it aimarker_postgres_user psql -U postgres -d aimarker
```

## Production Considerations

### SSL Certificates
Replace self-signed certificates with proper ones:
```bash
# Copy your certificates
cp your-cert.pem ~/aimarker/ssl/cert.pem
cp your-key.pem ~/aimarker/ssl/key.pem

# Restart Nginx
~/aimarker/stop.sh
~/aimarker/start.sh
```

### Monitoring
```bash
# Resource usage
docker stats

# Disk usage
du -sh ~/aimarker/data/*

# Service health
curl -s http://localhost:8004/health
curl -s http://localhost:8002/health
```

### Backups
```bash
# Manual backup
~/aimarker/backup.sh

# Schedule daily backups (add to crontab)
0 2 * * * /home/yourusername/aimarker/backup.sh
```

## Environment Variables

### Required (Minimum Setup)
```env
POSTGRES_PASSWORD=secure_password
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Optional (Enhanced Features)
```env
# Additional AI providers (all route through OpenRouter)
GOOGLE_AI_API_KEY=your_google_key

# Payment processing (currently disabled)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key

# Monitoring and analytics
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
DATADOG_CLIENT_TOKEN=your_datadog_token

# OCR service authentication (optional)
EASYOCR_API_KEY=optional_api_key
```

## Advantages of User-Space Deployment

✅ **No sudo/root required**  
✅ **All data in user directory**  
✅ **Easy to backup and migrate**  
✅ **No system-wide changes**  
✅ **Isolated from other services**  
✅ **Easy to uninstall (just delete folder)**  

## Support

If you encounter issues:

1. Check service status: `~/aimarker/status.sh`
2. View logs: `~/aimarker/logs.sh`
3. Test individual services:
   - App: `curl http://localhost:8004/api/health`
   - OCR: `curl http://localhost:8002/health`
4. Restart services: `~/aimarker/stop.sh && ~/aimarker/start.sh`
# AIMARKER VM Deployment Guide

Simple deployment guide for hosting AIMARKER on your VM without sudo access.

## Quick Start

### 1. Deploy
```bash
./deploy.sh
```

### 2. Configure API Keys
```bash
nano ~/aimarker/.env
```

**Required:**
```env
# Supabase (get from your Supabase project dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Service (get from openrouter.ai)
OPENROUTER_API_KEY=your_openrouter_key
```

### 3. Restart
```bash
~/aimarker/restart.sh
```

### 4. Access
**http://localhost:8003**

## What You Get

- ✅ **Full AI marking** with multiple models
- ✅ **EasyOCR service** for handwritten text recognition
- ✅ **PostgreSQL database** for data storage
- ✅ **Redis caching** for performance
- ✅ **All running on ports 8000-8003** (no conflicts)

## Management

```bash
~/aimarker/start.sh    # Start services
~/aimarker/stop.sh     # Stop services  
~/aimarker/restart.sh  # Restart services
~/aimarker/status.sh   # Check status
~/aimarker/logs.sh     # View logs
```

## Troubleshooting

**Docker permission denied?**
Ask admin to run: `sudo usermod -aG docker $USER` then logout/login.

**Services not starting?**
Check logs: `~/aimarker/logs.sh`

**Need to reset?**
```bash
~/aimarker/stop.sh
rm -rf ~/aimarker/data/*
~/aimarker/start.sh
```

## Services & Ports

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 8000 | Database |
| Redis | 8001 | Cache |
| OCR Service | 8002 | EasyOCR API |
| Main App | 8003 | Web interface |

That's it! Your AIMARKER app will be running with full functionality.
## OCR Service Security Setup

1. Generate a strong API key for the OCR service:
   ```bash
   openssl rand -base64 32
   ```

2. Set the API key as an environment variable on your OCR VM:
   ```bash
   echo "export OCR_SERVICE_API_KEY='your-generated-key'" >> ~/.bashrc
   source ~/.bashrc
   ```

3. Set the same API key as a Cloudflare secret:
   ```bash
   npx wrangler secret put OCR_SERVICE_API_KEY
   # Paste your generated key when prompted
   ```

4. Restart your OCR service to apply the environment variable
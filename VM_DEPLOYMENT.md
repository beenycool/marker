# AIMARKER VM Deployment Guide

This guide explains how to deploy the AIMARKER application on a Virtual Machine using Docker containers.

## Overview

The VM deployment uses:
- **Docker** for containerization
- **Docker Compose** for orchestration
- **Nginx** as reverse proxy and load balancer
- **PostgreSQL** for database
- **Redis** for caching and rate limiting

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- At least 4GB RAM and 20GB disk space
- Domain name with SSL certificates (optional but recommended)

## Quick Start

### 1. Automated Deployment

Run the automated deployment script:

```bash
sudo ./deploy-vm.sh
```

This script will:
- Install Docker and Docker Compose
- Configure firewall rules
- Set up SSL certificates (self-signed for development)
- Create necessary directories
- Deploy all services
- Set up automated backups
- Configure systemd service for auto-restart

### 2. Manual Configuration

After deployment, update the environment variables:

```bash
sudo nano /opt/aimarker/.env
```

Update all placeholder values with your actual configuration (see `.env.vm.example` for reference).

### 3. Restart Services

After updating environment variables:

```bash
cd /opt/aimarker
sudo docker compose -f docker-compose.prod.yml restart
```

## Architecture

```
Internet → Nginx (Port 80/443) → Next.js App (Port 3000)
                                        ↓
                               PostgreSQL (Port 5432)
                                        ↓
                                Redis (Port 6379)
```

## Files Created

| File | Description |
|------|-------------|
| `Dockerfile` | Container definition for the Next.js app |
| `docker-compose.prod.yml` | Production orchestration file |
| `nginx.conf` | Reverse proxy configuration |
| `deploy-vm.sh` | Automated deployment script |
| `.env.vm.example` | Environment variables template |

## Services

### 1. Nginx (Port 80/443)
- Reverse proxy for the Next.js application
- SSL termination
- Rate limiting
- Static file caching
- Security headers

### 2. Next.js Application (Port 3000)
- Main application container
- Built from Dockerfile
- Includes all API routes and pages

### 3. PostgreSQL (Port 5432)
- Database container
- Persistent data storage
- Health checks enabled

### 4. Redis (Port 6379)
- Caching layer
- Rate limiting storage
- Session storage

## Management Commands

### View Service Status
```bash
cd /opt/aimarker
sudo docker compose -f docker-compose.prod.yml ps
```

### View Logs
```bash
# All services
sudo docker compose -f docker-compose.prod.yml logs -f

# Specific service
sudo docker compose -f docker-compose.prod.yml logs -f app
```

### Restart Services
```bash
sudo docker compose -f docker-compose.prod.yml restart
```

### Update Application
```bash
cd /opt/aimarker
sudo docker compose -f docker-compose.prod.yml pull
sudo docker compose -f docker-compose.prod.yml up -d --build
```

### Access Database
```bash
sudo docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d aimarker
```

## SSL Configuration

### Development (Self-signed)
The deployment script creates self-signed certificates automatically for testing.

### Production (Let's Encrypt)
For production, replace the self-signed certificates:

```bash
# Install Certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/aimarker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/aimarker/ssl/key.pem

# Restart Nginx
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml restart nginx
```

## Monitoring and Logs

### Application Logs
```bash
# Application logs
sudo tail -f /var/log/aimarker/deploy.log

# Docker logs
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml logs -f
```

### Health Checks
```bash
# Application health
curl http://localhost/api/health

# Service health
curl http://localhost/health
```

### Resource Usage
```bash
# Container resource usage
sudo docker stats

# System resources
htop
df -h
```

## Backup and Recovery

### Automated Backups
Daily backups are automatically scheduled via cron:
- Database dump
- Environment files
- Configuration files
- Stored in `/opt/aimarker/backups/`

### Manual Backup
```bash
sudo /opt/aimarker/backup.sh
```

### Restore from Backup
```bash
# Stop services
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml down

# Extract backup
sudo tar -xzf /opt/aimarker/backups/backup_YYYYMMDD_HHMMSS.tar.gz -C /opt/aimarker/

# Restore database
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml up -d postgres
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml exec postgres psql -U postgres -d aimarker < /path/to/db_backup.sql

# Start all services
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml up -d
```

## Security Considerations

1. **Firewall**: Only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are open
2. **SSL**: All traffic is encrypted in production
3. **Rate Limiting**: API endpoints have rate limiting configured
4. **Security Headers**: Nginx adds security headers
5. **Container Security**: Containers run as non-root users
6. **Environment Variables**: Stored securely with restricted permissions

## Performance Optimization

### Database
- PostgreSQL is configured with reasonable defaults
- Connection pooling is handled by Supabase client
- Regular backups and cleanup

### Caching
- Redis for application caching
- Nginx for static file caching
- Next.js built-in optimizations

### Monitoring
- Health check endpoints
- Resource usage monitoring
- Log aggregation

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 443, 5432, and 6379 are available
2. **SSL issues**: Check certificate paths and permissions
3. **Database connection**: Verify PostgreSQL is running and accessible
4. **Environment variables**: Ensure all required variables are set

### Debug Commands
```bash
# Check container status
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml ps

# Check logs
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml logs app

# Test database connection
sudo docker compose -f /opt/aimarker/docker-compose.prod.yml exec postgres pg_isready

# Test application
curl -I http://localhost/api/health
```

## Scaling Considerations

For high-traffic deployments:

1. **Load Balancing**: Use multiple app containers behind Nginx
2. **Database**: Consider PostgreSQL replicas or managed database services
3. **Caching**: Implement Redis clustering
4. **CDN**: Use external CDN for static assets
5. **Monitoring**: Implement comprehensive monitoring with Prometheus/Grafana

## Support

For issues and questions:
- Check application logs: `/var/log/aimarker/deploy.log`
- Review container logs: `sudo docker compose logs`
- Health check: `curl http://localhost/api/health`
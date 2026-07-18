# Production Deployment Guide

> Step-by-step guide for deploying the Reverse Marketplace API to production.

## Architecture Overview

```
Internet → Nginx (SSL, rate limiting) → Fastify API → PostgreSQL + Redis
                                                    → BullMQ workers
                                                    → Socket.IO (WebSocket)
```

- **Nginx** terminates SSL, proxies to the API, handles WebSocket upgrades
- **API** runs as a Docker container (non-root, Alpine-based)
- **PostgreSQL 15** for persistent data (15 Prisma models)
- **Redis 7** for caching, job queues, WebSocket presence, rate limiting
- **BullMQ** workers for async notifications, auto-release, post/offer expiry

---

## 1. VPS Provisioning

**Recommended for MVP (2,500 users, year 1):**

| Resource | Spec | Cost |
|----------|------|------|
| VPS | DigitalOcean 4GB / 2 vCPU | ~$24/mo |
| Managed PostgreSQL (optional) | DO Managed DB, 1GB | ~$15/mo |
| Domain | Cloudflare DNS (free tier) | $0 |
| SSL | Let's Encrypt (free) | $0 |
| **Total** | | **~$24-39/mo** |

Well within the $1,000-1,600/mo budget. Scale up as needed.

### Create the Droplet

```bash
# DigitalOcean CLI or dashboard
# Ubuntu 22.04 LTS, 4GB RAM, 2 vCPU, SFO3/DFW region
doctl compute droplet create rm-prod \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region sfo3 \
  --ssh-keys YOUR_KEY_FINGERPRINT
```

---

## 2. Server Setup

```bash
# SSH into the server
ssh root@YOUR_SERVER_IP

# Create non-root user
adduser deploy
usermod -aG sudo deploy

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy

# Install Docker Compose plugin
apt-get install docker-compose-plugin

# Switch to deploy user
su - deploy
```

---

## 3. Deploy the Application

```bash
# Clone the repository
cd /opt
sudo mkdir reverse-marketplace && sudo chown deploy:deploy reverse-marketplace
git clone https://github.com/YOUR_ORG/ReverseMarketplace.git reverse-marketplace
cd reverse-marketplace

# Configure environment
cp .env.production.example backend/.env.production
nano backend/.env.production  # Fill in all values (see section below)

# Start services
docker compose -f docker-compose.production.yml up -d

# Run database migrations
docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy

# Seed initial data (categories + admin user) — run once only
docker compose -f docker-compose.production.yml exec api npx prisma db seed

# Verify
curl http://localhost:3000/health
```

---

## 4. SSL Setup (Let's Encrypt)

### Option A: Certbot with webroot

```bash
# Install certbot
sudo apt install certbot

# Get certificate (Nginx must be running on port 80)
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.yourdomain.com

# Copy certs to nginx/ssl/
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem nginx/ssl/
sudo chown deploy:deploy nginx/ssl/*.pem

# Restart nginx to pick up certs
docker compose -f docker-compose.production.yml restart nginx
```

### Auto-renewal cron

```bash
# Add to crontab (sudo crontab -e)
0 0 1 * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /opt/reverse-marketplace/nginx/ssl/ && \
  cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /opt/reverse-marketplace/nginx/ssl/ && \
  docker compose -f /opt/reverse-marketplace/docker-compose.production.yml exec nginx nginx -s reload
```

---

## 5. Environment Variables

All variables are documented in `.env.production.example`. Critical ones:

| Variable | How to get it |
|----------|---------------|
| `JWT_ACCESS_SECRET` | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 64` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen --forward-to api.yourdomain.com/api/v1/payments/webhook` |
| `SENDGRID_API_KEY` | SendGrid Dashboard → Settings → API Keys |
| `R2_*` | Cloudflare Dashboard → R2 → Manage API Tokens |
| `SENTRY_DSN` | Sentry → Project Settings → Client Keys |
| `GEMINI_API_KEY` | Google AI Studio → Get API key |
| `FCM_*` | Firebase Console → Project Settings → Service accounts |
| `METRICS_TOKEN` | `openssl rand -hex 32` |

---

## 6. Database Backups

### Automated daily backups

```bash
# Create backup directory
sudo mkdir -p /opt/reverse-marketplace/backups
sudo chown deploy:deploy /opt/reverse-marketplace/backups

# Add cron job (crontab -e)
0 3 * * * cd /opt/reverse-marketplace && \
  docker compose -f docker-compose.production.yml exec -T postgres \
  sh -c 'PGPASSWORD=$POSTGRES_PASSWORD pg_dump -U $POSTGRES_USER -Fc $POSTGRES_DB' \
  > backups/rm_$(date +\%Y\%m\%d).dump 2>> /var/log/rm-backup.log

# Or use the backup script
0 3 * * * /opt/reverse-marketplace/backend/scripts/backup.sh >> /var/log/rm-backup.log 2>&1
```

### Restore from backup

```bash
# List available backups
ls -la backups/

# Restore (destructive — replaces all data)
docker compose -f docker-compose.production.yml exec -T postgres \
  sh -c 'PGPASSWORD=$POSTGRES_PASSWORD pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --clean --if-exists' \
  < backups/rm_20260416.dump
```

---

## 7. Monitoring

### Health Check

```bash
curl https://api.yourdomain.com/health
# Returns: status, database, redis, queue metrics, memory, uptime
```

### Prometheus Metrics

```bash
# If METRICS_TOKEN is set:
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.yourdomain.com/metrics

# Scrape config for prometheus.yml:
# scrape_configs:
#   - job_name: 'reverse-marketplace'
#     scheme: https
#     bearer_token: 'YOUR_METRICS_TOKEN'
#     static_configs:
#       - targets: ['api.yourdomain.com']
```

### Sentry

- Error tracking is automatic when `SENTRY_DSN` is set
- Captures 500-level errors with request context (method, URL, user ID, request ID)
- Strips sensitive headers (Authorization, Cookie) before sending
- Set up alerts in Sentry Dashboard → Alerts → Create Alert Rule

### Log Access

```bash
# API logs
docker compose -f docker-compose.production.yml logs -f api

# Nginx access/error logs
docker compose -f docker-compose.production.yml logs -f nginx

# Follow all services
docker compose -f docker-compose.production.yml logs -f
```

---

## 8. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) automates:

1. **Lint & Typecheck** — runs on every push/PR
2. **Tests** — full Vitest suite with PostgreSQL + Redis services
3. **Build & Push** — Docker image pushed to GitHub Container Registry (main only)
4. **Deploy** — SSH into VPS, pull image, run migrations, restart (main only)

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | VPS IP address or hostname |
| `DEPLOY_USER` | SSH username (e.g., `deploy`) |
| `DEPLOY_SSH_KEY` | Private SSH key for the deploy user |

### Setup

1. Go to GitHub repo → Settings → Environments → Create "production"
2. Add the three secrets above
3. Optionally enable "Required reviewers" for manual deploy approval

### Manual Deploy

```bash
# On the VPS
cd /opt/reverse-marketplace
git pull origin main
docker compose -f docker-compose.production.yml pull api
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy
docker compose -f docker-compose.production.yml up -d --no-deps api
```

---

## 9. Rollback

```bash
# List available image tags
docker images ghcr.io/YOUR_ORG/reversemarketplace/api

# Roll back to a specific commit SHA
docker compose -f docker-compose.production.yml stop api
docker tag ghcr.io/YOUR_ORG/reversemarketplace/api:PREVIOUS_SHA \
           ghcr.io/YOUR_ORG/reversemarketplace/api:latest
docker compose -f docker-compose.production.yml up -d api

# If a migration needs reverting (rare — Prisma doesn't auto-rollback):
# 1. Create a new migration that undoes the change
# 2. Deploy forward
```

---

## 10. Scaling (When Needed)

**Phase 1 (MVP, 0-2,500 users):** Single VPS as described above.

**Phase 2 (2,500-10,000 users):**
- Upgrade VPS to 8GB/4vCPU (~$48/mo)
- Move to managed PostgreSQL (DigitalOcean, ~$15/mo)
- Add managed Redis (DigitalOcean, ~$15/mo)
- Total: ~$78/mo

**Phase 3 (10,000+ users):**
- Multiple API containers behind a load balancer
- PostgreSQL read replicas
- Redis Cluster or Sentinel
- CDN for static assets (Cloudflare, already planned)
- Consider managed container service (DO App Platform, AWS ECS)

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start all | `docker compose -f docker-compose.production.yml up -d` |
| Stop all | `docker compose -f docker-compose.production.yml down` |
| View logs | `docker compose -f docker-compose.production.yml logs -f api` |
| Run migrations | `docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy` |
| DB shell | `docker compose -f docker-compose.production.yml exec postgres psql -U $POSTGRES_USER $POSTGRES_DB` |
| Redis shell | `docker compose -f docker-compose.production.yml exec redis redis-cli` |
| Health check | `curl https://api.yourdomain.com/health` |
| Restart API | `docker compose -f docker-compose.production.yml restart api` |

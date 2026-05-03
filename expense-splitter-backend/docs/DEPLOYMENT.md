# Deployment Guide

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Platforms](#deployment-platforms)
3. [Docker Deployment](#docker-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Heroku Deployment](#heroku-deployment)
6. [DigitalOcean Deployment](#digitalocean-deployment)
7. [Production Configuration](#production-configuration)
8. [Monitoring Setup](#monitoring-setup)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing
- [ ] No console.log statements (except critical startup logs)
- [ ] No unused dependencies
- [ ] No hardcoded secrets
- [ ] No TODO/FIXME comments
- [ ] Code reviewed
- [ ] All endpoints documented

### Security

- [ ] JWT_SECRET is strong (32+ characters, random)
- [ ] HTTPS/SSL configured
- [ ] CORS set to specific domain
- [ ] Rate limiting configured
- [ ] Database authentication enabled
- [ ] .env file NOT in git
- [ ] Secrets in secure vault
- [ ] Security headers tested

### Performance

- [ ] Database indexes created
- [ ] Pagination implemented
- [ ] Queries optimized
- [ ] Connection pooling enabled
- [ ] Caching strategy defined
- [ ] CDN for static files configured
- [ ] Load testing completed

### Operations

- [ ] Monitoring configured
- [ ] Logging system tested
- [ ] Backup schedule set
- [ ] Disaster recovery plan
- [ ] Runbook created
- [ ] On-call rotation established
- [ ] Incident response plan

---

## Deployment Platforms

### Quick Comparison

| Platform                  | Difficulty | Cost   | Setup Time |
| ------------------------- | ---------- | ------ | ---------- |
| Docker + VM               | Medium     | Low    | 30 min     |
| AWS ECS                   | Medium     | Medium | 1 hour     |
| Heroku                    | Easy       | High   | 5 min      |
| DigitalOcean App Platform | Easy       | Low    | 15 min     |
| Railway                   | Easy       | Low    | 5 min      |
| Render                    | Easy       | Low    | 10 min     |

---

## Docker Deployment

### Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
```

### Create docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      MONGODB_URI: ${MONGODB_URI}
      RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID}
      RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET}
      CLIENT_URL: ${CLIENT_URL}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${DB_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASS}
    restart: unless-stopped

volumes:
  mongo_data:
```

### Build and Run

```bash
# Build image
docker build -t expense-splitter:latest .

# Run container
docker run -p 5000:5000 \
  -e JWT_SECRET="your-secret" \
  -e MONGODB_URI="mongodb://..." \
  expense-splitter:latest

# Or use docker-compose
docker-compose up -d
```

---

## AWS Deployment

### Option 1: EC2 + Manual Setup

#### 1. Launch EC2 Instance

```bash
# Instance specs
- AMI: Ubuntu 22.04 LTS
- Type: t3.small (1 GB RAM)
- Storage: 20 GB
- Security Group: Open ports 22, 80, 443, 5000
```

#### 2. SSH into Instance

```bash
ssh -i "your-key.pem" ubuntu@your-instance-ip
```

#### 3. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB (or use Atlas)
sudo apt install -y mongodb

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 4. Clone Repository

```bash
git clone https://github.com/your-username/expense-splitter-backend.git
cd expense-splitter-backend

# Install dependencies
npm install
```

#### 5. Configure Environment

```bash
# Create .env file
nano .env

# Add your production variables
NODE_ENV=production
JWT_SECRET=your-secure-secret
MONGODB_URI=mongodb://localhost:27017/expense-splitter
# ... other variables
```

#### 6. Setup PM2

```bash
# Start with PM2
pm2 start server.js --name "expense-splitter"

# Make it restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 logs "expense-splitter"
```

#### 7. Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/expense-splitter
```

**Nginx Config:**

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**Enable Config:**

```bash
sudo ln -s /etc/nginx/sites-available/expense-splitter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 8. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Option 2: ECS (Elastic Container Service)

#### 1. Create ECR Repository

```bash
aws ecr create-repository --repository-name expense-splitter
```

#### 2. Build and Push Image

```bash
# Build
docker build -t expense-splitter:latest .

# Tag
docker tag expense-splitter:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/expense-splitter:latest

# Push
aws ecr get-login-password --region REGION | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com

docker push \
  YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/expense-splitter:latest
```

#### 3. Create ECS Task & Service

```bash
# Create task definition
aws ecs register-task-definition \
  --family expense-splitter \
  --container-definitions file://task-definition.json

# Create service
aws ecs create-service \
  --cluster my-cluster \
  --service-name expense-splitter \
  --task-definition expense-splitter
```

---

## Heroku Deployment

### Easiest Option for Quick Deployment

#### 1. Install Heroku CLI

```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

#### 2. Login to Heroku

```bash
heroku login
```

#### 3. Create Procfile

```
# Procfile (in root directory)
web: npm start
```

#### 4. Create .env Configuration

```bash
heroku create expense-splitter-app

# Set environment variables
heroku config:set JWT_SECRET="your-secret" \
  MONGODB_URI="mongodb+srv://..." \
  RAZORPAY_KEY_ID="..." \
  RAZORPAY_KEY_SECRET="..." \
  NODE_ENV="production"
```

#### 5. Deploy

```bash
# Deploy
git push heroku main

# View logs
heroku logs --tail

# Scale dynos if needed
heroku scale web=2
```

---

## DigitalOcean Deployment

### Using App Platform (Simplest)

#### 1. Connect GitHub Repository

1. Go to DigitalOcean > App Platform
2. Click "Create App"
3. Connect GitHub account
4. Select your repository

#### 2. Configure App

```yaml
name: expense-splitter
services:
  - name: backend
    github:
      repo: your-username/expense-splitter-backend
      branch: main
    build_command: npm install
    run_command: npm start
    envs:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        value: ${JWT_SECRET}
      - key: MONGODB_URI
        value: ${MONGODB_URI}
    http_port: 5000
databases:
  - name: mongo
    engine: MONGODB
    version: "6"
```

#### 3. Deploy

1. DigitalOcean auto-deploys on push to main
2. View deployment status in dashboard
3. Access via assigned domain

---

## Production Configuration

### Environment Variables (Production)

```env
# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/expense-splitter
MONGODB_POOL_SIZE=10

# Authentication
JWT_SECRET=<generate-with-crypto.randomBytes(32).toString('hex')>
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/expense-splitter

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
```

### nginx Configuration (Production)

```nginx
# /etc/nginx/sites-available/expense-splitter

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
  listen 443 ssl http2;
  server_name your-domain.com;

  # SSL certificates (from Let's Encrypt)
  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Logging
  access_log /var/log/nginx/expense-splitter.access.log;
  error_log /var/log/nginx/expense-splitter.error.log;

  # Proxy to Node.js
  location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # WebSocket support
  location /socket.io {
    proxy_pass http://localhost:5000/socket.io;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## Monitoring Setup

### 1. Set Up Error Tracking (Sentry)

```bash
# Install Sentry SDK
npm install @sentry/node @sentry/tracing

# Add to server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 2. Set Up Log Aggregation (DataDog or ELK)

**For DataDog:**

```bash
npm install dd-trace

# Configure in server.js
const tracer = require('dd-trace').init();
```

### 3. Performance Monitoring

- Monitor request latency
- Track error rates
- Watch database query times
- Monitor memory usage
- Alert on rate limit hits

---

## Backup & Recovery

### MongoDB Backup Strategy

#### Automated Backups (MongoDB Atlas)

- Enable automatic backups (Atlas does by default)
- Set retention to 35 days
- Enable point-in-time recovery

#### Manual Backup

```bash
# Backup
mongodump \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/expense-splitter" \
  --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/expense-splitter" \
  /backup/20240327
```

### Log Backup

```bash
# Backup logs weekly
tar -czf /backup/logs-$(date +%Y%m%d).tar.gz logs/

# Compress old logs
gzip logs/*.log.*
```

---

## Troubleshooting

### Issues & Solutions

#### Port Already in Use

```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

#### Database Connection Fails

```bash
# Check MongoDB Atlas whitelist IP
# Add your server IP to IP Access List

# Verify connection string
mongo "mongodb+srv://user:pass@cluster.mongodb.net/test"
```

#### SSL Certificate Errors

```bash
# Renew certificate
sudo certbot renew --dry-run

# Or force renewal
sudo certbot renew --force-renewal
```

#### Memory Leak

```bash
# Check Node.js memory usage
ps aux | grep node

# Restart service
systemctl restart expense-splitter

# Or with PM2
pm2 restart expense-splitter
```

#### High CPU Usage

```bash
# Profile CPU
node --prof server.js

# Process profile
node --prof-process isolate-*.log > profile.txt
```

---

## Deployment Commands Cheat Sheet

```bash
# Docker
docker build -t expense-splitter .
docker run -p 5000:5000 expense-splitter

# PM2
pm2 start server.js
pm2 stop expense-splitter
pm2 restart expense-splitter
pm2 logs expense-splitter

# Nginx
sudo systemctl start nginx
sudo systemctl restart nginx
sudo nginx -t

# Heroku
heroku create app-name
git push heroku main
heroku open

# Certbot
certbot certonly --nginx -d domain.com
certbot renew

# MongoDB
mongodump --uri="..." --out=/backup
mongorestore --uri="..." /backup
```

---

## Post-Deployment

### Verify Deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Check logs
tail -f logs/combined.log
```

### Monitor First 24 Hours

- Watch error logs for issues
- Monitor response times
- Check database connections
- Verify rate limiting working
- Test all critical endpoints

---

## Maintenance Schedule

| Task                         | Frequency |
| ---------------------------- | --------- |
| Review logs                  | Daily     |
| Update dependencies          | Weekly    |
| Database backup verification | Weekly    |
| SSL cert renewal check       | Monthly   |
| Security audit               | Monthly   |
| Performance analysis         | Quarterly |
| Disaster recovery test       | Quarterly |
| Full security scan           | Annually  |

---

## Support

For deployment issues, check:

1. `logs/error.log`
2. `logs/combined.log`
3. Server monitoring dashboard
4. Platform-specific documentation
5. Application logs in platform console

**Status:** ✅ Production Ready

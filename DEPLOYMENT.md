# CloudPBX Deployment Guide for Ubuntu 24.10

This guide provides instructions for deploying CloudPBX on Ubuntu 24.10 LTS.

## System Requirements

- Ubuntu 24.10 (Oracular Oriole) or Ubuntu 24.04 LTS
- Minimum 2GB RAM (4GB recommended)
- Minimum 20GB storage
- Node.js 20.x or higher
- PostgreSQL 16.x
- Open ports: 80, 443, 5000 (app), 5060 (SIP), 10000-20000 (RTP)

## Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/cloudpbx.git
cd cloudpbx
```

### 2. Run the Installation Script

```bash
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```

## Manual Installation

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
```

### Step 3: Install PostgreSQL 16

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 4: Create Database

```bash
sudo -u postgres psql << EOF
CREATE USER cloudpbx WITH PASSWORD 'your_secure_password';
CREATE DATABASE cloudpbx_db OWNER cloudpbx;
GRANT ALL PRIVILEGES ON DATABASE cloudpbx_db TO cloudpbx;
EOF
```

### Step 5: Install Application Dependencies

```bash
cd /opt/cloudpbx
npm install
```

### Step 6: Configure Environment

Create `.env` file:

```bash
cat > .env << EOF
DATABASE_URL=postgresql://cloudpbx:your_secure_password@localhost:5432/cloudpbx_db
SESSION_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
PORT=5000
EOF
```

### Step 7: Initialize Database

```bash
npm run db:push
```

### Step 8: Build Application

```bash
npm run build
```

### Step 9: Create Systemd Service

```bash
sudo cat > /etc/systemd/system/cloudpbx.service << EOF
[Unit]
Description=CloudPBX Enterprise Phone System
After=network.target postgresql.service

[Service]
Type=simple
User=cloudpbx
WorkingDirectory=/opt/cloudpbx
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cloudpbx
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

### Step 10: Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudpbx
sudo systemctl start cloudpbx
```

## Nginx Reverse Proxy Configuration

```bash
sudo apt install -y nginx

sudo cat > /etc/nginx/sites-available/cloudpbx << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/cloudpbx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/TLS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Firewall Configuration

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 5060/udp    # SIP UDP
sudo ufw allow 5060/tcp    # SIP TCP
sudo ufw allow 5061/tcp    # SIP TLS
sudo ufw allow 10000:20000/udp  # RTP Media
sudo ufw enable
```

## Database Backup

Create automated daily backups:

```bash
sudo cat > /etc/cron.daily/cloudpbx-backup << EOF
#!/bin/bash
BACKUP_DIR=/var/backups/cloudpbx
mkdir -p \$BACKUP_DIR
pg_dump -U cloudpbx cloudpbx_db | gzip > \$BACKUP_DIR/cloudpbx_\$(date +%Y%m%d).sql.gz
find \$BACKUP_DIR -mtime +7 -delete
EOF

sudo chmod +x /etc/cron.daily/cloudpbx-backup
```

## Monitoring

Check application status:

```bash
sudo systemctl status cloudpbx
sudo journalctl -u cloudpbx -f
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U cloudpbx -h localhost -d cloudpbx_db
```

### Application Not Starting

```bash
# Check logs
sudo journalctl -u cloudpbx --no-pager -n 100

# Verify environment
cd /opt/cloudpbx && cat .env
```

### Port Conflicts

```bash
# Check what's using port 5000
sudo lsof -i :5000
```

## Updating CloudPBX

```bash
cd /opt/cloudpbx
git pull origin main
npm install
npm run build
npm run db:push
sudo systemctl restart cloudpbx
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| SESSION_SECRET | Secret for session encryption | Yes |
| NODE_ENV | Environment (production/development) | Yes |
| PORT | Application port (default: 5000) | No |
| AI_INTEGRATIONS_OPENAI_API_KEY | OpenAI API key for AI features | No |
| AI_INTEGRATIONS_OPENAI_BASE_URL | OpenAI base URL | No |

## Features Included

- 24 Pre-configured SIP Provider Templates
- 100 Device/Handset Templates
- AI-Powered Assistant
- Visual Voicemail with Transcription
- Smart Call Routing
- Live Wallboard Dashboard
- Analytics and Reporting
- 150+ Third-Party Integrations
- SMS and Fax Messaging
- Webhook API Support

## Support

For issues and feature requests, please open an issue on GitHub.

## License

CloudPBX Enterprise - Proprietary License

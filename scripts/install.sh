#!/bin/bash

# CloudPBX Installation Script for Ubuntu 24.10
# This script automates the installation of CloudPBX

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root (use sudo)"
    exit 1
fi

# Check Ubuntu version
UBUNTU_VERSION=$(lsb_release -rs)
log_info "Detected Ubuntu version: $UBUNTU_VERSION"

# Variables
INSTALL_DIR="/opt/cloudpbx"
DB_NAME="cloudpbx_db"
DB_USER="cloudpbx"
DB_PASS=$(openssl rand -hex 16)
SESSION_SECRET=$(openssl rand -hex 32)

log_info "Starting CloudPBX installation..."

# Update system
log_info "Updating system packages..."
apt update && apt upgrade -y

# Install dependencies
log_info "Installing system dependencies..."
apt install -y curl wget git build-essential

# Install Node.js 20.x
log_info "Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
log_info "Node.js version: $(node --version)"
log_info "npm version: $(npm --version)"

# Install PostgreSQL
log_info "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Create database and user
log_info "Setting up database..."
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

# Create application user
log_info "Creating application user..."
if ! id -u cloudpbx &>/dev/null; then
    useradd -r -s /bin/false cloudpbx
fi

# Create installation directory
log_info "Setting up installation directory..."
mkdir -p $INSTALL_DIR
cp -r . $INSTALL_DIR/
chown -R cloudpbx:cloudpbx $INSTALL_DIR

# Create environment file
log_info "Creating environment configuration..."
cat > $INSTALL_DIR/.env << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
NODE_ENV=production
PORT=5000
EOF
chmod 600 $INSTALL_DIR/.env

# Install dependencies
log_info "Installing application dependencies..."
cd $INSTALL_DIR
npm install

# Build application
log_info "Building application..."
npm run build

# Initialize database
log_info "Initializing database..."
npm run db:push

# Create systemd service
log_info "Creating systemd service..."
cat > /etc/systemd/system/cloudpbx.service << EOF
[Unit]
Description=CloudPBX Enterprise Phone System
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=cloudpbx
Group=cloudpbx
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cloudpbx
Environment=NODE_ENV=production
EnvironmentFile=$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
log_info "Starting CloudPBX service..."
systemctl daemon-reload
systemctl enable cloudpbx
systemctl start cloudpbx

# Install Nginx
log_info "Installing and configuring Nginx..."
apt install -y nginx

cat > /etc/nginx/sites-available/cloudpbx << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/cloudpbx /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
systemctl enable nginx

# Configure firewall
log_info "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 5060/udp
    ufw allow 5060/tcp
    ufw allow 5061/tcp
    ufw allow 10000:20000/udp
    ufw --force enable
fi

# Create backup script
log_info "Setting up automated backups..."
mkdir -p /var/backups/cloudpbx
cat > /etc/cron.daily/cloudpbx-backup << EOF
#!/bin/bash
BACKUP_DIR=/var/backups/cloudpbx
mkdir -p \$BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME | gzip > \$BACKUP_DIR/cloudpbx_\$(date +%Y%m%d_%H%M%S).sql.gz
find \$BACKUP_DIR -mtime +7 -delete
EOF
chmod +x /etc/cron.daily/cloudpbx-backup

# Print credentials
log_info "============================================"
log_info "CloudPBX Installation Complete!"
log_info "============================================"
log_info ""
log_info "Access your CloudPBX at: http://$(hostname -I | awk '{print $1}')"
log_info ""
log_info "Database Credentials (saved to $INSTALL_DIR/.env):"
log_info "  Database: $DB_NAME"
log_info "  User: $DB_USER"
log_info "  Password: $DB_PASS"
log_info ""
log_info "Service Management:"
log_info "  Start: sudo systemctl start cloudpbx"
log_info "  Stop: sudo systemctl stop cloudpbx"
log_info "  Status: sudo systemctl status cloudpbx"
log_info "  Logs: sudo journalctl -u cloudpbx -f"
log_info ""
log_info "For SSL/TLS, install certbot:"
log_info "  sudo apt install certbot python3-certbot-nginx"
log_info "  sudo certbot --nginx -d your-domain.com"
log_info "============================================"

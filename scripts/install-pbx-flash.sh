#!/bin/bash

# CloudPBX Installation Script for PBX in a Flash
# Supports CentOS/RHEL (older PIAF) and Debian (newer PIAF) based systems
# This script installs CloudPBX Admin Dashboard on a PBX in a Flash server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root (use sudo)"
    exit 1
fi

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
        OS_VERSION=$(cat /etc/redhat-release | grep -oE '[0-9]+\.[0-9]+' | head -1)
    else
        log_error "Cannot detect operating system"
        exit 1
    fi

    log_info "Detected OS: $OS $OS_VERSION"
}

detect_os

# Variables
INSTALL_DIR="/opt/cloudpbx"
DB_NAME="cloudpbx_db"
DB_USER="cloudpbx"
DB_PASS=$(openssl rand -hex 16)
SESSION_SECRET=$(openssl rand -hex 32)
APP_PORT=5000

log_step "Starting CloudPBX installation on PBX in a Flash..."
log_info "Installation directory: $INSTALL_DIR"
log_info "Application port: $APP_PORT"

# Update system packages
log_step "Updating system packages..."
case "$OS" in
    centos|rhel|fedora|almalinux|rocky)
        yum update -y || dnf update -y
        PKG_MGR="yum"
        if command -v dnf &> /dev/null; then
            PKG_MGR="dnf"
        fi
        ;;
    debian|ubuntu)
        apt update && apt upgrade -y
        PKG_MGR="apt"
        ;;
    *)
        log_error "Unsupported OS: $OS"
        exit 1
        ;;
esac

# Install system dependencies
log_step "Installing system dependencies..."
case "$OS" in
    centos|rhel|fedora|almalinux|rocky)
        $PKG_MGR install -y curl wget git gcc gcc-c++ make openssl
        ;;
    debian|ubuntu)
        apt install -y curl wget git build-essential openssl
        ;;
esac

# Install Node.js 20.x
log_step "Installing Node.js 20.x..."
if ! command -v node &> /dev/null || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    log_info "Installing Node.js 20.x from NodeSource..."
    case "$OS" in
        centos|rhel|fedora|almalinux|rocky)
            # Install Node.js using NodeSource for RHEL/CentOS
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            $PKG_MGR install -y nodejs
            ;;
        debian|ubuntu)
            # Install Node.js using NodeSource for Debian/Ubuntu
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt install -y nodejs
            ;;
    esac
else
    log_info "Node.js $(node --version) already installed"
fi

log_info "Node.js version: $(node --version)"
log_info "npm version: $(npm --version)"

# Install PostgreSQL
log_step "Installing PostgreSQL..."
case "$OS" in
    centos|rhel|fedora|almalinux|rocky)
        # Check if PostgreSQL is already installed
        if ! command -v psql &> /dev/null; then
            log_info "Installing PostgreSQL 16..."
            # Install PostgreSQL 16 repository
            $PKG_MGR install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-$(rpm -E %{rhel})-x86_64/pgdg-redhat-repo-latest.noarch.rpm 2>/dev/null || true
            # Disable built-in PostgreSQL module (RHEL 8+)
            if command -v dnf &> /dev/null; then
                dnf -qy module disable postgresql 2>/dev/null || true
            fi
            # Install PostgreSQL 16
            $PKG_MGR install -y postgresql16-server postgresql16-contrib

            # Initialize database
            if [ ! -f /var/lib/pgsql/16/data/PG_VERSION ]; then
                /usr/pgsql-16/bin/postgresql-16-setup initdb
            fi

            # Start and enable PostgreSQL
            systemctl start postgresql-16
            systemctl enable postgresql-16

            # Add PostgreSQL to PATH
            export PATH=/usr/pgsql-16/bin:$PATH
            echo 'export PATH=/usr/pgsql-16/bin:$PATH' >> /etc/profile.d/pgsql.sh
        else
            log_info "PostgreSQL is already installed"
            systemctl start postgresql-16 2>/dev/null || systemctl start postgresql
            systemctl enable postgresql-16 2>/dev/null || systemctl enable postgresql
        fi
        ;;
    debian|ubuntu)
        if ! command -v psql &> /dev/null; then
            log_info "Installing PostgreSQL..."
            apt install -y postgresql postgresql-contrib
        else
            log_info "PostgreSQL is already installed"
        fi
        systemctl start postgresql
        systemctl enable postgresql
        ;;
esac

# Wait for PostgreSQL to be ready
log_info "Waiting for PostgreSQL to be ready..."
sleep 3

# Create database and user
log_step "Setting up database..."
sudo -u postgres psql << EOF 2>/dev/null || true
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

log_info "Database '$DB_NAME' created successfully"

# Create application user
log_step "Creating application user..."
if ! id -u cloudpbx &>/dev/null; then
    useradd -r -s /bin/bash -d /opt/cloudpbx -m cloudpbx
    log_info "User 'cloudpbx' created"
else
    log_info "User 'cloudpbx' already exists"
fi

# Create installation directory
log_step "Setting up installation directory..."
mkdir -p $INSTALL_DIR

# Check if we're running from the repo or need to clone
if [ -f "$(dirname "$(dirname "$0")")/package.json" ]; then
    log_info "Installing from local repository..."
    REPO_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")"
    # Copy everything except node_modules, dist, and .git
    rsync -av --exclude 'node_modules' --exclude 'dist' --exclude '.git' "$REPO_DIR/" "$INSTALL_DIR/" 2>/dev/null || \
    cp -r "$REPO_DIR"/* "$INSTALL_DIR/" 2>/dev/null || \
    (cd "$REPO_DIR" && tar --exclude='node_modules' --exclude='dist' --exclude='.git' -cf - .) | (cd "$INSTALL_DIR" && tar -xf -)
else
    log_info "Cloning from GitHub repository..."
    if [ -d "$INSTALL_DIR/.git" ]; then
        cd $INSTALL_DIR && git pull
    else
        git clone https://github.com/nexusct/cloudpbx-admin-dashboard.git $INSTALL_DIR
    fi
fi

chown -R cloudpbx:cloudpbx $INSTALL_DIR

# Create environment file
log_step "Creating environment configuration..."
cat > $INSTALL_DIR/.env << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
NODE_ENV=production
PORT=$APP_PORT
EOF

chmod 600 $INSTALL_DIR/.env
chown cloudpbx:cloudpbx $INSTALL_DIR/.env

log_info "Environment file created"

# Install dependencies
log_step "Installing application dependencies..."
cd $INSTALL_DIR
sudo -u cloudpbx npm install

# Build application
log_step "Building application..."
sudo -u cloudpbx npm run build

# Initialize database
log_step "Initializing database schema..."
sudo -u cloudpbx npm run db:push

# Create systemd service
log_step "Creating systemd service..."
cat > /etc/systemd/system/cloudpbx.service << 'EOF'
[Unit]
Description=CloudPBX Admin Dashboard
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=cloudpbx
Group=cloudpbx
WorkingDirectory=/opt/cloudpbx
ExecStart=/usr/bin/node dist/index.cjs
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cloudpbx
Environment=NODE_ENV=production
EnvironmentFile=/opt/cloudpbx/.env

[Install]
WantedBy=multi-user.target
EOF

# For RHEL/CentOS with PostgreSQL 16
if [[ "$OS" =~ ^(centos|rhel|fedora|almalinux|rocky)$ ]]; then
    sed -i 's/postgresql.service/postgresql-16.service/g' /etc/systemd/system/cloudpbx.service
fi

# Reload systemd and start service
log_step "Starting CloudPBX service..."
systemctl daemon-reload
systemctl enable cloudpbx
systemctl start cloudpbx

# Wait for service to start
sleep 3

# Check service status
if systemctl is-active --quiet cloudpbx; then
    log_info "CloudPBX service started successfully"
else
    log_warn "CloudPBX service may not have started correctly. Check: journalctl -u cloudpbx -n 50"
fi

# Configure web server (Apache is commonly used in PBX in a Flash)
log_step "Configuring web server reverse proxy..."

# Detect if Apache or Nginx is installed
if command -v httpd &> /dev/null || command -v apache2 &> /dev/null; then
    log_info "Configuring Apache reverse proxy..."

    case "$OS" in
        centos|rhel|fedora|almalinux|rocky)
            # Enable required Apache modules
            HTTPD_CONF="/etc/httpd/conf.modules.d/00-proxy.conf"
            cat > $HTTPD_CONF << 'EOF'
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
EOF

            # Create CloudPBX virtual host config
            cat > /etc/httpd/conf.d/cloudpbx.conf << EOF
<VirtualHost *:80>
    ServerName cloudpbx.local

    # Proxy WebSocket connections
    ProxyPreserveHost On
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://127.0.0.1:$APP_PORT/\$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://127.0.0.1:$APP_PORT/\$1 [P,L]

    ProxyPass / http://127.0.0.1:$APP_PORT/
    ProxyPassReverse / http://127.0.0.1:$APP_PORT/

    ProxyTimeout 300
</VirtualHost>

# CloudPBX Admin Dashboard on port 8080
Listen 8080
<VirtualHost *:8080>
    ServerName cloudpbx.local

    ProxyPreserveHost On
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://127.0.0.1:$APP_PORT/\$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://127.0.0.1:$APP_PORT/\$1 [P,L]

    ProxyPass / http://127.0.0.1:$APP_PORT/
    ProxyPassReverse / http://127.0.0.1:$APP_PORT/

    ProxyTimeout 300
</VirtualHost>
EOF

            # Test and reload Apache
            httpd -t && systemctl reload httpd || log_warn "Apache configuration test failed"
            systemctl enable httpd
            systemctl start httpd
            ;;

        debian|ubuntu)
            # Enable required Apache modules
            a2enmod proxy proxy_http proxy_wstunnel rewrite

            # Create CloudPBX virtual host config
            cat > /etc/apache2/sites-available/cloudpbx.conf << EOF
<VirtualHost *:8080>
    ServerName cloudpbx.local

    ProxyPreserveHost On
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://127.0.0.1:$APP_PORT/\$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://127.0.0.1:$APP_PORT/\$1 [P,L]

    ProxyPass / http://127.0.0.1:$APP_PORT/
    ProxyPassReverse / http://127.0.0.1:$APP_PORT/

    ProxyTimeout 300
</VirtualHost>
EOF

            # Add Listen 8080 if not already present
            if ! grep -q "Listen 8080" /etc/apache2/ports.conf; then
                echo "Listen 8080" >> /etc/apache2/ports.conf
            fi

            a2ensite cloudpbx
            apache2ctl -t && systemctl reload apache2 || log_warn "Apache configuration test failed"
            systemctl enable apache2
            systemctl start apache2
            ;;
    esac

    log_info "Apache configured to proxy CloudPBX on port 8080"

elif command -v nginx &> /dev/null; then
    log_info "Configuring Nginx reverse proxy..."

    cat > /etc/nginx/conf.d/cloudpbx.conf << EOF
server {
    listen 8080;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

    nginx -t && systemctl reload nginx
    systemctl enable nginx
    log_info "Nginx configured to proxy CloudPBX on port 8080"
else
    log_warn "No web server (Apache/Nginx) detected. CloudPBX will be accessible directly on port $APP_PORT"
fi

# Configure firewall
log_step "Configuring firewall..."
if command -v firewall-cmd &> /dev/null; then
    # FirewallD (CentOS/RHEL)
    log_info "Configuring FirewallD..."
    systemctl start firewalld 2>/dev/null || true
    systemctl enable firewalld 2>/dev/null || true

    firewall-cmd --permanent --add-port=8080/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=$APP_PORT/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true

    log_info "Firewall configured (opened ports 8080, $APP_PORT)"
elif command -v ufw &> /dev/null; then
    # UFW (Debian/Ubuntu)
    log_info "Configuring UFW..."
    ufw allow 8080/tcp 2>/dev/null || true
    ufw allow $APP_PORT/tcp 2>/dev/null || true

    log_info "Firewall configured (opened ports 8080, $APP_PORT)"
else
    log_warn "No firewall detected. You may need to manually open ports 8080 and $APP_PORT"
fi

# Create backup script
log_step "Setting up automated database backups..."
mkdir -p /var/backups/cloudpbx

cat > /usr/local/bin/cloudpbx-backup.sh << EOF
#!/bin/bash
BACKUP_DIR=/var/backups/cloudpbx
mkdir -p \$BACKUP_DIR
PGPASSWORD='$DB_PASS' pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > \$BACKUP_DIR/cloudpbx_\$(date +%Y%m%d_%H%M%S).sql.gz
find \$BACKUP_DIR -name "cloudpbx_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/cloudpbx-backup.sh

# Add to crontab for cloudpbx user
(crontab -u cloudpbx -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/cloudpbx-backup.sh") | crontab -u cloudpbx -

log_info "Daily backup scheduled at 2:00 AM"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Print installation summary
echo ""
log_step "============================================"
log_step "CloudPBX Installation Complete!"
log_step "============================================"
echo ""
log_info "Access CloudPBX Admin Dashboard:"
log_info "  - Via Web Proxy: http://$SERVER_IP:8080"
log_info "  - Direct Access: http://$SERVER_IP:$APP_PORT"
echo ""
log_info "Installation Details:"
log_info "  - Install Directory: $INSTALL_DIR"
log_info "  - Database: $DB_NAME"
log_info "  - Database User: $DB_USER"
log_info "  - Database Password: $DB_PASS"
log_info "  - Credentials saved to: $INSTALL_DIR/.env"
echo ""
log_info "Service Management:"
log_info "  - Start: systemctl start cloudpbx"
log_info "  - Stop: systemctl stop cloudpbx"
log_info "  - Restart: systemctl restart cloudpbx"
log_info "  - Status: systemctl status cloudpbx"
log_info "  - Logs: journalctl -u cloudpbx -f"
echo ""
log_info "Asterisk AMI Integration:"
log_info "  - The CloudPBX dashboard can connect to this server's Asterisk"
log_info "  - AMI connection details are in: /etc/asterisk/manager.conf"
log_info "  - Default AMI host: localhost"
log_info "  - Default AMI port: 5038"
log_info "  - Configure integration in the CloudPBX web interface"
echo ""
log_info "Database Backups:"
log_info "  - Automatic daily backups at 2:00 AM"
log_info "  - Backup location: /var/backups/cloudpbx/"
log_info "  - Retention: 7 days"
echo ""
log_info "Next Steps:"
log_info "  1. Open CloudPBX in your browser"
log_info "  2. Create your admin account"
log_info "  3. Navigate to Integrations → PBX in a Flash"
log_info "  4. Configure AMI connection (use 'localhost' if on same server)"
log_step "============================================"
echo ""

# Test if service is running
if systemctl is-active --quiet cloudpbx; then
    log_info "✓ CloudPBX service is running"
else
    log_error "✗ CloudPBX service is not running. Check logs: journalctl -u cloudpbx -n 50"
fi

echo ""
log_info "Installation log saved to: /var/log/cloudpbx-install.log"

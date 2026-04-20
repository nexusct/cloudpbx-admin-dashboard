# CloudPBX Installation Scripts

This directory contains installation and utility scripts for deploying CloudPBX Admin Dashboard on various platforms.

## Available Scripts

### 1. install.sh

**Platform**: Ubuntu 24.10 / 24.04 LTS

Automated installation script for Ubuntu-based systems. This is the recommended script for standalone Ubuntu servers.

**Usage**:
```bash
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```

**What it does**:
- Installs Node.js 20.x
- Installs and configures PostgreSQL
- Creates database and user
- Builds and installs CloudPBX
- Sets up systemd service
- Configures Nginx reverse proxy
- Sets up UFW firewall
- Configures automated backups

**Access after installation**: `http://YOUR_SERVER_IP` (port 80)

---

### 2. install-pbx-flash.sh

**Platform**: PBX in a Flash (CentOS/RHEL/Debian)

Specialized installation script for PBX in a Flash servers. This script is designed to install CloudPBX directly on a PBX in a Flash installation.

**Supported Systems**:
- CentOS 6/7/8
- RHEL 7/8/9
- AlmaLinux 8/9
- Rocky Linux 8/9
- Debian 9/10/11/12
- Ubuntu (all versions)

**Usage**:
```bash
chmod +x scripts/install-pbx-flash.sh
sudo ./scripts/install-pbx-flash.sh
```

**What it does**:
- Auto-detects OS (CentOS/Debian)
- Installs Node.js 20.x
- Installs PostgreSQL (version 16 on RHEL/CentOS)
- Creates database and user
- Builds and installs CloudPBX
- Sets up systemd service
- Configures Apache OR Nginx reverse proxy on port 8080
- Sets up FirewallD (CentOS/RHEL) or UFW (Debian/Ubuntu)
- Configures automated database backups
- Provides AMI integration guidance

**Access after installation**:
- `http://YOUR_SERVER_IP:8080` (web proxy)
- `http://YOUR_SERVER_IP:5000` (direct access)

**Key Differences from install.sh**:
- Multi-OS support (CentOS, RHEL, Debian, Ubuntu)
- Uses port 8080 to avoid conflicts with existing web interfaces (FreePBX)
- Configures either Apache or Nginx based on what's installed
- Includes specific guidance for local Asterisk AMI connection

**Documentation**: See [docs/integrations/pbx-in-a-flash-install.md](../docs/integrations/pbx-in-a-flash-install.md)

---

### 3. import_github_issues.mjs

**Purpose**: Import GitHub issues from the repository into the application.

**Usage**:
```bash
./scripts/import_github_issues.sh
```

Or directly:
```bash
node scripts/import_github_issues.mjs
```

---

### 4. backlog_to_github_issues.mjs

**Purpose**: Convert backlog items to GitHub issues.

**Usage**:
```bash
node scripts/backlog_to_github_issues.mjs
```

---

## Choosing the Right Installation Script

### Use `install.sh` when:
- Installing on a standalone Ubuntu 24.10 or 24.04 LTS server
- You want CloudPBX as the primary application on the server
- You want to connect to remote PBX systems

### Use `install-pbx-flash.sh` when:
- Installing on a PBX in a Flash server
- Installing on CentOS, RHEL, AlmaLinux, or Rocky Linux
- You want to manage the local PBX from the same machine
- You need to run alongside FreePBX or other PBX web interfaces

## Installation Requirements

Both installation scripts require:
- **Root access** (run with `sudo`)
- **Minimum 2GB RAM** (4GB recommended)
- **Minimum 5GB free disk space**
- **Internet connection** (to download dependencies)

## Post-Installation

After running either installation script:

1. **Access the web interface** at the URL provided
2. **Create your admin account** on first login
3. **Configure integrations** in the Integrations section
4. **Connect to your PBX systems** (Asterisk, Twilio, etc.)

## Service Management

Both scripts install CloudPBX as a systemd service:

```bash
# Start the service
sudo systemctl start cloudpbx

# Stop the service
sudo systemctl stop cloudpbx

# Restart the service
sudo systemctl restart cloudpbx

# Check status
sudo systemctl status cloudpbx

# View logs
sudo journalctl -u cloudpbx -f
```

## Database Backups

Both scripts configure automated daily database backups:

- **Backup location**: `/var/backups/cloudpbx/`
- **Schedule**: Daily at 2:00 AM
- **Retention**: 7 days

Manual backup:
```bash
sudo /usr/local/bin/cloudpbx-backup.sh
```

## Troubleshooting

### Check service status
```bash
sudo systemctl status cloudpbx
```

### View recent logs
```bash
sudo journalctl -u cloudpbx -n 100
```

### Check database connection
```bash
sudo -u cloudpbx psql -h localhost -d cloudpbx_db
```

### Test web server
```bash
# For Nginx
sudo nginx -t
sudo systemctl status nginx

# For Apache (RHEL/CentOS)
sudo httpd -t
sudo systemctl status httpd

# For Apache (Debian/Ubuntu)
sudo apache2ctl -t
sudo systemctl status apache2
```

## Documentation

- [Architecture Overview](../docs/architecture.md)
- [Ubuntu Deployment Guide](../DEPLOYMENT.md)
- [PBX in a Flash Installation Guide](../docs/integrations/pbx-in-a-flash-install.md)
- [PBX in a Flash AMI Integration](../docs/integrations/pbx-in-a-flash.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/nexusct/cloudpbx-admin-dashboard/issues
- Documentation: https://github.com/nexusct/cloudpbx-admin-dashboard/tree/main/docs

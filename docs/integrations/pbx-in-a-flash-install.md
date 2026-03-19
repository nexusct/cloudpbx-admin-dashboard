# Installing CloudPBX Admin Dashboard on PBX in a Flash

This guide explains how to install the CloudPBX Admin Dashboard directly on a PBX in a Flash server, allowing you to manage your PBX system from the same machine.

## Overview

PBX in a Flash (PIAF) is an Asterisk-based PBX distribution that runs on either CentOS/RHEL or Debian Linux. The CloudPBX Admin Dashboard can be installed directly on your PIAF server to provide a modern web interface for managing extensions, monitoring calls, and configuring your phone system.

## Prerequisites

Before starting the installation, ensure your PBX in a Flash server meets these requirements:

- **Operating System**: CentOS 6/7/8, RHEL 7/8, AlmaLinux 8/9, Rocky Linux 8/9, or Debian 9/10/11/12
- **RAM**: Minimum 2GB (4GB recommended for production use)
- **Storage**: At least 5GB free space for the application
- **Root Access**: Required for installation
- **Internet Connection**: Required to download dependencies

## Quick Installation

The simplest way to install CloudPBX on your PBX in a Flash server is using our automated installation script.

### 1. Download the Installation Script

SSH into your PBX in a Flash server and run:

```bash
curl -fsSL https://raw.githubusercontent.com/nexusct/cloudpbx-admin-dashboard/main/scripts/install-pbx-flash.sh -o install-pbx-flash.sh
chmod +x install-pbx-flash.sh
```

Alternatively, if you've already cloned the repository:

```bash
cd cloudpbx-admin-dashboard
chmod +x scripts/install-pbx-flash.sh
```

### 2. Run the Installation

Execute the script as root:

```bash
sudo ./install-pbx-flash.sh
```

Or if running from the repository:

```bash
sudo ./scripts/install-pbx-flash.sh
```

The script will automatically:
- Detect your operating system (CentOS/Debian)
- Install Node.js 20.x
- Install and configure PostgreSQL
- Create the CloudPBX database
- Build and install the application
- Configure a systemd service
- Set up Apache/Nginx reverse proxy on port 8080
- Configure firewall rules
- Set up automated database backups

### 3. Access the Dashboard

Once installation is complete, you can access CloudPBX at:

- **Via Web Proxy**: `http://YOUR_SERVER_IP:8080`
- **Direct Access**: `http://YOUR_SERVER_IP:5000`

Replace `YOUR_SERVER_IP` with your server's IP address (shown at the end of installation).

## What Gets Installed

The installation script sets up the following components:

### System Packages

- **Node.js 20.x**: JavaScript runtime for the application
- **PostgreSQL**: Database server (version 16 on RHEL/CentOS, latest on Debian)
- **Build Tools**: gcc, make, git (if not already present)

### Application Components

- **Installation Directory**: `/opt/cloudpbx`
- **Application User**: `cloudpbx` (dedicated system user)
- **Database**: `cloudpbx_db`
- **Environment File**: `/opt/cloudpbx/.env` (contains database credentials)

### Services

- **CloudPBX Service**: `systemd` service running on port 5000
- **Web Proxy**: Apache or Nginx proxy on port 8080
- **Database Backups**: Daily automated backups at 2:00 AM

### Firewall Rules

The following ports are opened:
- **8080**: Web proxy access
- **5000**: Direct application access (optional)

## Post-Installation Setup

### 1. Create Admin Account

1. Open CloudPBX in your browser: `http://YOUR_SERVER_IP:8080`
2. You'll be prompted to create an admin account on first access
3. Enter your desired username and password
4. Click "Create Account"

### 2. Connect to Local Asterisk

Since CloudPBX is installed on the same server as your PBX in a Flash installation, you can connect to Asterisk via localhost:

1. Navigate to **Integrations** in the CloudPBX dashboard
2. Click on **PBX in a Flash** or **Asterisk AMI**
3. Enter the following connection details:
   - **Host**: `localhost` or `127.0.0.1`
   - **Port**: `5038`
   - **Username**: Your AMI username (from `/etc/asterisk/manager.conf`)
   - **Secret**: Your AMI password

4. Click **Test Connection** to verify
5. Click **Save** to complete the integration

### 3. Configure Asterisk Manager Interface (if not already done)

If you haven't configured AMI access yet:

1. Edit the AMI configuration:
   ```bash
   nano /etc/asterisk/manager.conf
   ```

2. Ensure AMI is enabled in the `[general]` section:
   ```ini
   [general]
   enabled = yes
   port = 5038
   bindaddr = 127.0.0.1
   ```

3. Add a user for CloudPBX:
   ```ini
   [cloudpbx]
   secret = YOUR_SECURE_PASSWORD
   deny = 0.0.0.0/0.0.0.0
   permit = 127.0.0.1/255.255.255.255
   read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan,originate
   write = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan,originate
   ```

4. Reload Asterisk Manager:
   ```bash
   asterisk -rx "manager reload"
   ```

## Service Management

Control the CloudPBX service using systemd:

```bash
# Start the service
sudo systemctl start cloudpbx

# Stop the service
sudo systemctl stop cloudpbx

# Restart the service
sudo systemctl restart cloudpbx

# Check service status
sudo systemctl status cloudpbx

# View live logs
sudo journalctl -u cloudpbx -f

# View last 100 log lines
sudo journalctl -u cloudpbx -n 100
```

## Database Backups

Automated backups are configured to run daily at 2:00 AM.

### Backup Location

Backups are stored in: `/var/backups/cloudpbx/`

### Backup Retention

Backups older than 7 days are automatically deleted.

### Manual Backup

To create a manual backup:

```bash
sudo /usr/local/bin/cloudpbx-backup.sh
```

### Restore from Backup

To restore from a backup file:

```bash
# Stop the CloudPBX service
sudo systemctl stop cloudpbx

# Restore the database
gunzip < /var/backups/cloudpbx/cloudpbx_YYYYMMDD_HHMMSS.sql.gz | \
  sudo -u postgres psql cloudpbx_db

# Start the CloudPBX service
sudo systemctl start cloudpbx
```

## Updating CloudPBX

To update to the latest version:

```bash
# Navigate to installation directory
cd /opt/cloudpbx

# Stop the service
sudo systemctl stop cloudpbx

# Backup current installation
sudo cp -r /opt/cloudpbx /opt/cloudpbx.backup

# Pull latest changes (if installed via git)
sudo -u cloudpbx git pull

# Or download and extract latest release
# curl -L https://github.com/nexusct/cloudpbx-admin-dashboard/archive/main.tar.gz | tar xz --strip-components=1

# Install dependencies
sudo -u cloudpbx npm install

# Build application
sudo -u cloudpbx npm run build

# Run database migrations
sudo -u cloudpbx npm run db:push

# Start the service
sudo systemctl start cloudpbx

# Check status
sudo systemctl status cloudpbx
```

## Troubleshooting

### Service Won't Start

Check the logs for errors:
```bash
sudo journalctl -u cloudpbx -n 50
```

Common issues:
- **Database connection failed**: Check PostgreSQL is running: `sudo systemctl status postgresql` or `sudo systemctl status postgresql-16`
- **Port already in use**: Check if another service is using port 5000: `sudo netstat -tlnp | grep 5000`
- **Permission issues**: Ensure `/opt/cloudpbx` is owned by `cloudpbx` user: `sudo chown -R cloudpbx:cloudpbx /opt/cloudpbx`

### Cannot Access Web Interface

1. Check CloudPBX service is running:
   ```bash
   sudo systemctl status cloudpbx
   ```

2. Check web server (Apache/Nginx) is running:
   ```bash
   # For Apache (RHEL/CentOS)
   sudo systemctl status httpd

   # For Apache (Debian/Ubuntu)
   sudo systemctl status apache2

   # For Nginx
   sudo systemctl status nginx
   ```

3. Check firewall rules:
   ```bash
   # For FirewallD (RHEL/CentOS)
   sudo firewall-cmd --list-ports

   # For UFW (Debian/Ubuntu)
   sudo ufw status
   ```

4. Try direct access on port 5000:
   ```
   http://YOUR_SERVER_IP:5000
   ```

### AMI Connection Issues

1. Verify AMI is enabled and accessible:
   ```bash
   telnet localhost 5038
   ```
   You should see an Asterisk Call Manager response.

2. Check `/etc/asterisk/manager.conf` for correct credentials

3. Reload Asterisk Manager:
   ```bash
   asterisk -rx "manager reload"
   ```

4. Check Asterisk is running:
   ```bash
   asterisk -rx "core show version"
   ```

### Database Issues

1. Check PostgreSQL is running:
   ```bash
   # RHEL/CentOS
   sudo systemctl status postgresql-16

   # Debian/Ubuntu
   sudo systemctl status postgresql
   ```

2. Test database connection:
   ```bash
   sudo -u cloudpbx psql -h localhost -d cloudpbx_db
   ```

3. View database connection string:
   ```bash
   sudo cat /opt/cloudpbx/.env | grep DATABASE_URL
   ```

## Uninstalling CloudPBX

To remove CloudPBX from your server:

```bash
# Stop and disable service
sudo systemctl stop cloudpbx
sudo systemctl disable cloudpbx

# Remove systemd service file
sudo rm /etc/systemd/system/cloudpbx.service
sudo systemctl daemon-reload

# Remove application files
sudo rm -rf /opt/cloudpbx

# Remove database (optional)
sudo -u postgres psql -c "DROP DATABASE cloudpbx_db;"
sudo -u postgres psql -c "DROP USER cloudpbx;"

# Remove application user
sudo userdel cloudpbx

# Remove web server configuration
# For Apache (RHEL/CentOS)
sudo rm /etc/httpd/conf.d/cloudpbx.conf
sudo systemctl reload httpd

# For Apache (Debian/Ubuntu)
sudo rm /etc/apache2/sites-available/cloudpbx.conf
sudo a2dissite cloudpbx
sudo systemctl reload apache2

# For Nginx
sudo rm /etc/nginx/conf.d/cloudpbx.conf
sudo systemctl reload nginx

# Remove backup script
sudo rm /usr/local/bin/cloudpbx-backup.sh

# Remove backups (optional)
sudo rm -rf /var/backups/cloudpbx
```

## Security Considerations

### Default Configuration

The installation script creates secure random passwords for:
- Database user password
- Session secret

These are stored in `/opt/cloudpbx/.env` with restrictive permissions (600).

### Firewall

By default, the script opens:
- Port 8080 (web proxy)
- Port 5000 (direct access - optional)

Consider restricting access to specific IP addresses if needed.

### SSL/TLS

For production use, configure SSL/TLS encryption:

#### Using Let's Encrypt with Apache (RHEL/CentOS)

```bash
# Install certbot
sudo yum install certbot python3-certbot-apache -y

# Obtain certificate
sudo certbot --apache -d your-pbx-domain.com

# Auto-renewal is configured automatically
```

#### Using Let's Encrypt with Apache (Debian/Ubuntu)

```bash
# Install certbot
sudo apt install certbot python3-certbot-apache -y

# Obtain certificate
sudo certbot --apache -d your-pbx-domain.com
```

### Database Security

- Database is configured to listen only on localhost
- Dedicated database user with minimal privileges
- Automated backups with 7-day retention

## Integration with PBX in a Flash Features

### FreePBX Integration

If your PBX in a Flash installation includes FreePBX:
- CloudPBX complements FreePBX rather than replaces it
- Use CloudPBX for modern UI, monitoring, and multi-PBX management
- Use FreePBX for detailed dialplan and advanced Asterisk configuration

### Accessing Both Interfaces

- **FreePBX**: Usually on port 80 or default Apache vhost
- **CloudPBX**: Configured on port 8080 by the installer

Both can run simultaneously on the same server.

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/nexusct/cloudpbx-admin-dashboard/issues
- Documentation: https://github.com/nexusct/cloudpbx-admin-dashboard/docs

## Related Documentation

- [PBX in a Flash AMI Integration](pbx-in-a-flash.md) - Connecting CloudPBX to remote PBX in a Flash servers
- [Architecture Overview](../architecture.md) - Technical details about CloudPBX
- [Ubuntu Deployment Guide](../../DEPLOYMENT.md) - Installing on Ubuntu servers

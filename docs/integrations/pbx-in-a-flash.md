# PBX in a Flash (Asterisk AMI) Integration

The CloudPBX Admin Dashboard supports live synchronization with any PBX powered by Asterisk, including PBX in a Flash, Incredible PBX, and FreePBX.

This integration connects via the **Asterisk Manager Interface (AMI)** to pull active Extensions (SIP/PJSIP Peers) and SIP Trunks (Registries).

## 1. Enabling the Asterisk Manager Interface

By default, Asterisk's Manager API might only listen on localhost (`127.0.0.1`) for security reasons. To allow the CloudPBX Dashboard to connect, you must edit `manager.conf`.

1. SSH into your PBX server.
2. Open the AMI configuration file:

   ```bash
   nano /etc/asterisk/manager.conf
   ```

3. Locate the `[general]` section and ensure it is enabled and bound to the correct interface (or `0.0.0.0` for all interfaces):

   ```ini
   [general]
   enabled = yes
   port = 5038
   bindaddr = 0.0.0.0
   ```

4. Create a new user specifically for CloudPBX at the bottom of the file:

   ```ini
   [cloudpbx]
   secret = YOUR_SECURE_PASSWORD_HERE
   deny = 0.0.0.0/0.0.0.0
   permit = 192.168.1.0/255.255.255.0 ; Replace with the IP/Subnet of your Dashboard server
   read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan,originate
   write = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan,originate
   ```

5. Reload the Asterisk Manager to apply the changes:

   ```bash
   asterisk -rx "manager reload"
   ```

## 2. Firewall Configuration

If your CloudPBX Dashboard is hosted on a different network than your PBX, you must open the AMI port on your PBX firewall.

### UFW (Ubuntu/Debian)

```bash
sudo ufw allow from <YOUR_DASHBOARD_IP> to any port 5038 proto tcp
sudo ufw enable
```

### Firewalld (CentOS/AlmaLinux)

```bash
sudo firewall-cmd --zone=public --add-rich-rule='rule family="ipv4" source address="<YOUR_DASHBOARD_IP>" port protocol="tcp" port="5038" accept' --permanent
sudo firewall-cmd --reload
```

## 3. Connecting the Dashboard

1. Open the CloudPBX Admin Dashboard.
2. Navigate to **Integrations**.
3. Search for **PBX in a Flash** and select it.
4. Enter the required details:
   - **Asterisk Host IP**: The IP address or hostname of your PBX.
   - **AMI Port**: `5038` (Unless you changed it in step 1).
   - **AMI Username**: `cloudpbx` (Or the user you created).
   - **AMI Secret**: The password you set in `manager.conf`.
5. Click **Connect**.

## 4. Syncing Data

Once connected, you will see a badge indicating the integration is active.

- Click the **Sync Data** button.
- The dashboard will query Asterisk using `SIPpeers` and `SIPshowregistry` actions.
- Your Extensions and SIP Trunk statuses will be updated in the system.

## Troubleshooting

- **Connection Refused**: Your firewall is blocking port `5038`, or `bindaddr` is still set to `127.0.0.1` in `manager.conf`.
- **Authentication Failed**: Double-check the username, secret, and ensure the dashboard's IP matches the `permit` line in the AMI user block.
- **Missing Data**: Ensure the user has the `read = system,call...` permissions enabled.

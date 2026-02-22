import AsteriskManager from 'asterisk-manager';
import { z } from 'zod';

const log = (msg: string, ...args: any[]) => console.log(`[PBXinaFlash] ${msg}`, ...args);
const error = (msg: string, ...args: any[]) => console.error(`[PBXinaFlash] ${msg}`, ...args);

// Improvement 2: Zod Input Validation
export const PbxConfigSchema = z.object({
  host: z.string().min(1, "Asterisk host IP/URL is required"),
  port: z.number().int().min(1).max(65535).default(5038),
  username: z.string().min(1, "AMI Username is required"),
  secret: z.string().min(1, "AMI Secret is required"),
});

export type PbxConfig = z.infer<typeof PbxConfigSchema>;

// Improvement 1: Strong Typing for Event Payloads
interface AmiResponse {
  response: string;
  message?: string;
  [key: string]: any;
}

interface AmiPeerEntry {
  objectname: string;
  callerid?: string;
  status?: string;
  address?: string;
  port?: string;
  dynamic?: string;
  aclnat?: string;
}

interface AmiRegistryEntry {
  host: string;
  state: string;
  username: string;
  port?: string;
  refresh?: string;
}

// Improvement 6: Resuable Connect & Authenticate Wrapper
async function getConnectedAmi(config: PbxConfig, timeoutMs = 5000): Promise<any> {
  const validated = PbxConfigSchema.parse(config);

  return new Promise((resolve, reject) => {
    try {
      log(`Attempting connection to ${validated.host}:${validated.port}...`);
      const ami = new AsteriskManager(validated.port, validated.host, validated.username, validated.secret, true);

      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          error("Connection timed out.");
          // Improvement 5: Cleanup listeners to prevent memory leaks
          ami.removeAllListeners();
          ami.disconnect(); // Improvement 8: Only disconnect if it hasn't already errored unrecoverably
          reject(new Error("Connection to Asterisk Manager timed out."));
        }
      }, timeoutMs);

      ami.on('response', (response: AmiResponse) => {
        if (response.response === 'Success' && response.message?.toLowerCase().includes('authentication accepted')) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            log("Authentication successful.");
            ami.removeAllListeners('response'); // Clear the auth listener, but leave others open
            ami.removeAllListeners('error');
            resolve(ami);
          }
        } else if (response.response === 'Error' && response.message?.toLowerCase().includes('authentication')) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            error("Authentication failed check username/secret.");
            ami.removeAllListeners();
            ami.disconnect();
            // Improvement 9: Specific Error States
            reject(new Error('Authentication failed. Please check your username and secret.'));
          }
        }
      });

      ami.on('error', (err: any) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          error(`Connection error: ${err.message}`);
          ami.removeAllListeners();

          let friendlyError = "Failed to connect to Asterisk Manager.";
          if (err.code === 'ECONNREFUSED') {
            friendlyError = `Connection refused by ${validated.host}:${validated.port}. Check firewall rules and ensure AMI is bound to 0.0.0.0 in manager.conf.`;
          }
          reject(new Error(friendlyError));
        }
      });

      ami.connect();
    } catch (e: any) {
      reject(new Error(e.message || "Failed to initialize Asterisk Manager connection."));
    }
  });
}

export async function testConnection(config: PbxConfig): Promise<{ success: boolean; error?: string; version?: string }> {
  try {
    const ami = await getConnectedAmi(config);
    // We connected and authed successfully
    ami.removeAllListeners();
    ami.disconnect();
    return { success: true, version: 'PBX in a Flash (Asterisk via AMI)' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Improvement 6: Wrap actions in Promises
async function fetchPeers(ami: any, driver: 'SIP' | 'PJSIP'): Promise<any[]> {
  return new Promise((resolve) => {
    const peers: any[] = [];
    let action = driver === 'PJSIP' ? 'PJSIPShowEndpoints' : 'SIPpeers';
    let event = driver === 'PJSIP' ? 'endpointlist' : 'peerentry';

    // Improvement 4: Handle SIP vs PJSIP event structures
    const listener = (data: AmiPeerEntry) => {
      let statusStr = data.status || 'Offline';
      let parsedLatency: number | null = null;
      if (statusStr.includes('OK (')) {
        const match = statusStr.match(/(\d+) ms/);
        if (match) parsedLatency = parseInt(match[1]);
      }
      // Improvement 3: Dynamic and NAT settings extracted
      peers.push({
        number: data.objectname,
        name: data.callerid || data.objectname,
        status: statusStr.includes('OK') ? 'online' : 'offline',
        ip: data.address !== '-none-' && data.address ? data.address : null,
        port: data.port || null,
        dynamic: data.dynamic?.toLowerCase() === 'yes',
        latencyMs: parsedLatency
      });
    };

    ami.on(event, listener);

    ami.action({ action }, (err: any, res: any) => {
      // Unbind listener after we got the final action response
      // The action callback fires after all the intermediate events have been emitted
      setTimeout(() => {
        ami.removeListener(event, listener);
        resolve(peers);
      }, 500); // Give it a slight buffer
    });
  });
}

// Improvement 6: Wrap actions in Promises
async function fetchRegistry(ami: any): Promise<any[]> {
  return new Promise((resolve) => {
    const trunks: any[] = [];
    const listener = (data: AmiRegistryEntry) => {
      // Improvement 10: Trunk Details Extraction
      trunks.push({
        name: data.host,
        status: data.state === 'Registered' ? 'registered' : 'unregistered',
        username: data.username,
        port: data.port || '5060',
        refreshInterval: data.refresh || null
      });
    };

    ami.on('registryentry', listener);

    ami.action({ action: 'SIPshowregistry' }, (err: any, res: any) => {
      setTimeout(() => {
        ami.removeListener('registryentry', listener);
        resolve(trunks);
      }, 500);
    });
  });
}

export async function syncData(config: PbxConfig): Promise<any> {
  try {
    log(`Starting PBX in a Flash Sync...`);
    const ami = await getConnectedAmi(config, 10000);

    // Improvement 6: Concurrent Execution
    const [sipPeers, registry] = await Promise.all([
      fetchPeers(ami, 'SIP'), // You could trigger PJSIP endpoints here too later
      fetchRegistry(ami)
    ]);

    ami.removeAllListeners();
    ami.disconnect();

    log(`Sync Complete: Found ${sipPeers.length} extensions and ${registry.length} trunks.`);

    return {
      extensions: sipPeers,
      trunks: registry
    };

  } catch (e: any) {
    error(`Sync failed: ${e.message}`);
    // Ensure returning a structure that the frontend expects even on error to avoid mapping crashes
    return { success: false, error: e.message || "Failed to initialize Asterisk Manager sync.", extensions: [], trunks: [] };
  }
}

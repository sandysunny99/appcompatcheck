/**
 * System Information Utility
 * Captures system details during scanning operations
 */

import os from 'os';
import { headers } from 'next/headers';

export interface SystemInformation {
  // Server information (where the scan is processed)
  serverHostname: string;
  serverPlatform: string;
  serverArchitecture: string;
  serverCpus: number;
  serverTotalMemory: string;
  serverFreeMemory: string;
  serverUptime: string;
  serverNodeVersion: string;
  serverOsVersion: string;
  serverUsername: string | null;
  
  // Client information (from the browser/device accessing the app)
  clientPlatform: string | null;
  clientUserAgent: string | null;
  clientIpAddress: string | null;
  clientTimezone: string | null;
  clientLanguage: string | null;
  clientScreenResolution: string | null;
  
  // Legacy fields for backward compatibility
  hostname: string; // Maps to serverHostname
  deviceName: string; // Maps to clientPlatform or serverHostname
  platform: string; // Maps to serverPlatform
  architecture: string; // Maps to serverArchitecture
  cpus: number; // Maps to serverCpus
  totalMemory: string; // Maps to serverTotalMemory
  freeMemory: string; // Maps to serverFreeMemory
  uptime: string; // Maps to serverUptime
  nodeVersion: string; // Maps to serverNodeVersion
  osVersion: string; // Maps to serverOsVersion
  username: string | null; // Maps to serverUsername
  ipAddress: string | null; // Maps to clientIpAddress
  userAgent: string | null; // Maps to clientUserAgent
  
  capturedAt: string;
}

/**
 * Get system information from the server, optionally merging with client-side data
 */
export async function getSystemInformation(clientInfo?: {
  platform?: string;
  timezone?: string;
  language?: string;
  screenResolution?: string;
}): Promise<SystemInformation> {
  const headersList = await headers();
  
  // Get IP address from headers
  const ipAddress = 
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    null;

  // Get user agent
  const userAgent = headersList.get('user-agent') || null;

  // Get server username (process owner)
  const serverUsername = os.userInfo().username || null;

  // Calculate memory in GB
  const totalMemory = `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`;
  const freeMemory = `${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`;

  // Calculate uptime
  const uptimeSeconds = os.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptime = `${days}d ${hours}h ${minutes}m`;

  const serverHostname = os.hostname();
  const serverPlatform = os.platform();
  const serverArchitecture = os.arch();
  const serverCpus = os.cpus().length;
  const serverNodeVersion = process.version;
  const serverOsVersion = `${os.type()} ${os.release()}`;

  return {
    // Server information
    serverHostname,
    serverPlatform,
    serverArchitecture,
    serverCpus,
    serverTotalMemory: totalMemory,
    serverFreeMemory: freeMemory,
    serverUptime: uptime,
    serverNodeVersion,
    serverOsVersion,
    serverUsername,
    
    // Client information
    clientPlatform: clientInfo?.platform || null,
    clientUserAgent: userAgent,
    clientIpAddress: ipAddress,
    clientTimezone: clientInfo?.timezone || null,
    clientLanguage: clientInfo?.language || null,
    clientScreenResolution: clientInfo?.screenResolution || null,
    
    // Legacy fields for backward compatibility
    hostname: serverHostname,
    deviceName: clientInfo?.platform || serverHostname,
    platform: serverPlatform,
    architecture: serverArchitecture,
    cpus: serverCpus,
    totalMemory,
    freeMemory,
    uptime,
    nodeVersion: serverNodeVersion,
    osVersion: serverOsVersion,
    username: serverUsername,
    ipAddress,
    userAgent,
    
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Get system information from client headers (for API routes)
 */
export function getSystemInformationFromRequest(request: Request): Partial<SystemInformation> {
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    null;

  const userAgent = request.headers.get('user-agent') || null;

  return {
    ipAddress,
    userAgent,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Format system information for display
 */
export function formatSystemInformation(sysInfo: SystemInformation): string {
  return `
System Information:
- Hostname: ${sysInfo.hostname}
- Device: ${sysInfo.deviceName}
- Platform: ${sysInfo.platform} (${sysInfo.architecture})
- OS: ${sysInfo.osVersion}
- CPUs: ${sysInfo.cpus} cores
- Memory: ${sysInfo.freeMemory} free / ${sysInfo.totalMemory} total
- Uptime: ${sysInfo.uptime}
- Node: ${sysInfo.nodeVersion}
- User: ${sysInfo.username || 'Unknown'}
- IP Address: ${sysInfo.ipAddress || 'Unknown'}
- Captured: ${new Date(sysInfo.capturedAt).toLocaleString()}
  `.trim();
}

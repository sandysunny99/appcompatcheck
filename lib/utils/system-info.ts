/**
 * System Information Utility
 * Captures system details during scanning operations
 */

import os from 'os';
import { headers } from 'next/headers';

export interface SystemInformation {
  hostname: string;
  deviceName: string;
  platform: string;
  architecture: string;
  cpus: number;
  totalMemory: string;
  freeMemory: string;
  uptime: string;
  nodeVersion: string;
  osVersion: string;
  username: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  capturedAt: string;
}

/**
 * Get system information from the server
 */
export async function getSystemInformation(): Promise<SystemInformation> {
  const headersList = await headers();
  
  // Get IP address from headers
  const ipAddress = 
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    null;

  // Get user agent
  const userAgent = headersList.get('user-agent') || null;

  // Get username (current user running the process)
  const username = os.userInfo().username || null;

  // Calculate memory in GB
  const totalMemory = `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`;
  const freeMemory = `${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`;

  // Calculate uptime
  const uptimeSeconds = os.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptime = `${days}d ${hours}h ${minutes}m`;

  return {
    hostname: os.hostname(),
    deviceName: os.hostname(), // Same as hostname for consistency
    platform: os.platform(),
    architecture: os.arch(),
    cpus: os.cpus().length,
    totalMemory,
    freeMemory,
    uptime,
    nodeVersion: process.version,
    osVersion: `${os.type()} ${os.release()}`,
    username,
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

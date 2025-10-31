# System Information Architecture Documentation

## Problem Statement

**Original Issue**: Reports were showing "clackysi-machine" as the hostname instead of the client's device name.

**Root Cause**: The `os.hostname()` function captures the **server's** hostname (where Next.js is running), not the client's device name.

## Understanding Client vs Server Context

### Why We Can't Get Client Hostname via HTTP

In a web application architecture:

```
┌─────────────────┐         HTTP Request          ┌──────────────────┐
│  Client Browser │  ────────────────────────────> │  Next.js Server  │
│  (User's Device)│                                 │  (clackysi-      │
│                 │  <────────────────────────────  │   machine)       │
│  - Real hostname│         HTTP Response           │                  │
│  - NOT accessible                                 │  - os.hostname() │
│    via HTTP     │                                 │    returns this  │
└─────────────────┘                                 └──────────────────┘
```

**Security Restriction**: Browsers **cannot** expose the client's computer name for security and privacy reasons. HTTP headers do not include hostname information.

### What Information IS Available?

| Information Type | Source | Available? |
|-----------------|--------|------------|
| **Client Hostname** | Client OS | ❌ **NO** - Security restriction |
| **Client IP Address** | HTTP Headers | ✅ YES - Via `x-forwarded-for` |
| **User Agent** | HTTP Headers | ✅ YES - Via `user-agent` header |
| **Browser Platform** | JavaScript | ✅ YES - Via `navigator.platform` |
| **Screen Resolution** | JavaScript | ✅ YES - Via `window.screen` |
| **Timezone** | JavaScript | ✅ YES - Via `Intl.DateTimeFormat` |
| **Language** | JavaScript | ✅ YES - Via `navigator.language` |
| **Server Hostname** | Node.js OS module | ✅ YES - Via `os.hostname()` |

## Solution Architecture

### New Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SCAN INITIATION                               │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  1. Client-Side (Browser)                                            │
│     - Capture: platform, timezone, language, screen resolution       │
│     - Function: getClientSystemInfo()                                │
│     - Location: lib/utils/client-system-info.ts                     │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Include in request body
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  2. API Request (POST /api/scan)                                     │
│     Body: {                                                          │
│       scanName: "...",                                               │
│       clientSystemInfo: {                                            │
│         platform: "MacIntel",                                        │
│         timezone: "America/New_York",                                │
│         language: "en-US",                                           │
│         screenResolution: "1920x1080"                                │
│       }                                                              │
│     }                                                                │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  3. Server-Side Processing                                           │
│     - Merge client info with server info                            │
│     - Function: getSystemInformation(clientInfo)                     │
│     - Location: lib/utils/system-info.ts                            │
│                                                                      │
│     Server captures:                                                 │
│     - serverHostname: "clackysi-machine"                            │
│     - serverPlatform: "linux"                                        │
│     - serverArchitecture: "x64"                                      │
│     - CPU, memory, uptime                                           │
│                                                                      │
│     Client info (from request):                                      │
│     - clientPlatform: "MacIntel"                                     │
│     - clientIpAddress: "192.168.1.100"                              │
│     - clientUserAgent: "Mozilla/5.0..."                             │
│     - clientTimezone, clientLanguage, clientScreenResolution         │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  4. Store in Database                                                │
│     results.systemInformation = {                                    │
│       serverHostname,                                                │
│       serverPlatform,                                                │
│       clientPlatform,                                                │
│       clientIpAddress,                                               │
│       ... (all fields)                                               │
│     }                                                                │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  5. Display in Reports                                               │
│     - PDF Report: Separate sections for Client/Server/Scan Meta     │
│     - Dashboard: Organized sections with clear labels               │
└──────────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Client-Side Utility (`lib/utils/client-system-info.ts`)

```typescript
export function getClientSystemInfo(): ClientSystemInfo {
  return {
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  };
}
```

**Usage in Client Components**:
```typescript
import { getClientSystemInfo } from '@/lib/utils/client-system-info';

// Before initiating scan
const clientInfo = getClientSystemInfo();

fetch('/api/scan', {
  method: 'POST',
  body: JSON.stringify({
    scanName: 'My Scan',
    clientSystemInfo: clientInfo, // Include client info
  }),
});
```

### 2. Server-Side Utility (`lib/utils/system-info.ts`)

**Updated Interface**:
```typescript
export interface SystemInformation {
  // Server information (where scan is processed)
  serverHostname: string;
  serverPlatform: string;
  serverArchitecture: string;
  // ... more server fields
  
  // Client information (from browser)
  clientPlatform: string | null;
  clientUserAgent: string | null;
  clientIpAddress: string | null;
  clientTimezone: string | null;
  clientLanguage: string | null;
  clientScreenResolution: string | null;
  
  // Legacy fields (for backward compatibility)
  hostname: string; // → serverHostname
  deviceName: string; // → clientPlatform or serverHostname
  ipAddress: string | null; // → clientIpAddress
  // ...
}
```

**Function Signature**:
```typescript
export async function getSystemInformation(clientInfo?: {
  platform?: string;
  timezone?: string;
  language?: string;
  screenResolution?: string;
}): Promise<SystemInformation>
```

### 3. API Route Updates (`app/api/scan/route.ts`)

**Accept Client Info**:
```typescript
const body = await request.json();
const { 
  scanName, 
  scanType,
  clientSystemInfo = {} // New parameter
} = body;

// Pass to background processor
processScanInBackground(scanId, {
  // ...
  clientSystemInfo,
});
```

**Capture Combined Info**:
```typescript
const systemInfo = await getSystemInformation(context.clientSystemInfo);
```

### 4. Report Display

**PDF Report** (`lib/reports/report-generator.ts`):
- **Section 1**: CLIENT DEVICE (Browser)
  - Platform, IP Address, Timezone, Language, Screen Resolution, User Agent
- **Section 2**: SCAN METADATA
  - Scanned By, Scan Timestamp
- **Section 3**: SCAN SERVER (Optional)
  - Server Hostname, Server Platform

**Dashboard** (`components/reports/ScanResultsView.tsx`):
- Three collapsible sections with clear headings
- Icons for each field
- Proper formatting for technical details

## Migration and Backward Compatibility

### Handling Old Scans

Old scans won't have the new client/server fields. The system handles this gracefully:

```typescript
// Fallback logic in report generation
if ((systemInfo as any).clientPlatform) {
  // Use new field
  display((systemInfo as any).clientPlatform);
} else if (systemInfo.deviceName) {
  // Fallback to legacy field
  display(systemInfo.deviceName);
}
```

### Legacy Fields

Legacy fields are maintained for backward compatibility:
- `hostname` → maps to `serverHostname`
- `deviceName` → maps to `clientPlatform` (if available) or `serverHostname`
- `ipAddress` → maps to `clientIpAddress`

## Testing

### Manual Test Procedure

1. **Start Application**:
   ```bash
   npm run dev
   ```

2. **Open Browser Console** and test client info capture:
   ```javascript
   // Test in browser console
   const info = {
     platform: navigator.platform,
     timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
     language: navigator.language,
     screen: `${window.screen.width}x${window.screen.height}`
   };
   console.log('Client Info:', info);
   ```

3. **Initiate a Scan** (update client code to include clientSystemInfo)

4. **Check Report**:
   - View scan results page
   - Generate PDF report
   - Verify "Client Device" section shows browser platform, not "clackysi-machine"
   - Verify "Scan Server" section shows "clackysi-machine" (for transparency)

### Expected Output

**Before Fix**:
```
Host/Device Name: clackysi-machine  ❌ Wrong (server hostname)
```

**After Fix**:
```
=== CLIENT DEVICE (Browser) ===
Platform: MacIntel                   ✅ Correct (client platform)
IP Address: 192.168.1.100
Timezone: America/New_York
Language: en-US
Screen Resolution: 1920x1080

=== SCAN SERVER ===
Server Hostname: clackysi-machine    ✅ Clearly labeled as server
```

## Security Considerations

### What We DON'T Expose

- ❌ Client's actual computer hostname (not available via browser)
- ❌ Client's file system paths
- ❌ Client's running processes

### What We DO Collect

- ✅ Browser platform identifier (e.g., "MacIntel", "Win32")
- ✅ Public IP address (already available in HTTP headers)
- ✅ User agent (already available in HTTP headers)
- ✅ Timezone and language (useful for audit trails)
- ✅ Screen resolution (helps with UX analysis)

All client-side information is:
1. **Non-sensitive** - Available to any website via standard browser APIs
2. **Transparent** - Clearly displayed in reports
3. **Useful** - Helps identify which device/browser was used for the scan

## Future Enhancements

### Possible Improvements

1. **Client Hostname Input** (Optional):
   - Add optional field in UI for users to manually enter their device name
   - Only if they want it in reports

2. **Device Fingerprinting**:
   - More sophisticated device identification
   - Track multiple scans from same device

3. **GeoIP Lookup**:
   - Convert IP address to approximate location
   - Add timezone validation

4. **User Preferences**:
   - Let users configure which system info to include in reports
   - Privacy settings

## Summary

✅ **Problem Solved**: "clackysi-machine" no longer appears as client device name

✅ **Approach**: Clear separation of client vs server information

✅ **Implementation**: Capture browser info client-side, merge with server info

✅ **Display**: Organized sections in reports with clear labels

✅ **Backward Compatible**: Old scans still work with fallback logic

The system now accurately represents what information comes from the client device (browser) vs the server, providing transparency and proper audit trails in scan reports.

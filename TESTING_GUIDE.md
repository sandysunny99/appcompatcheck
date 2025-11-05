# Testing Guide - Verify Client System Info Fix

## 🎯 Purpose

This guide will walk you through testing the complete fix for the hostname reporting issue. You'll verify that:
1. ✅ Scans can be initiated without database errors
2. ✅ Client system info is captured from your browser
3. ✅ Reports show YOUR device platform (not "clackysi-machine")
4. ✅ Server hostname is clearly labeled as "SCAN SERVER"

---

## 📋 Prerequisites

- Application running on http://localhost:3000
- User account created and logged in
- Browser console accessible (F12 or Right-click → Inspect)

---

## 🧪 Test Procedure

### **Step 1: Access the Scan Page**

1. Open your browser and navigate to: `http://localhost:3000/scan/system`
2. You should see the "System Compatibility Scan" page with a "Start Scan" button
3. If redirected to login, sign in first

**Expected Result**: ✅ Scan page loads without errors

---

### **Step 2: Open Browser Console**

1. Press `F12` or right-click anywhere and select "Inspect"
2. Click on the "Console" tab
3. Keep this open during the scan to monitor client info capture

**Expected Result**: ✅ Console is open and ready

---

### **Step 3: Initiate Scan**

1. Click the **"Start Scan"** button
2. Watch the console output

**Expected Console Output**:
```javascript
Client System Info: {
  platform: "MacIntel",           // or "Win32", "Linux x86_64"
  timezone: "America/New_York",   // your timezone
  language: "en-US",              // your language
  screenResolution: "1920x1080"   // your screen resolution
}
```

3. Watch the progress bar on the page
4. You should see status updates:
   - "Collecting system information..."
   - "Initiating scan..."
   - "Scan running in background..."
   - "Processing results..."
   - "Scan complete!"

**Expected Result**: 
- ✅ Console shows your actual platform (MacIntel/Win32, NOT "clackysi-machine")
- ✅ No errors in console
- ✅ Progress bar reaches 100%
- ✅ "Scan Complete" message appears

**If you see errors**:
- Check console for error messages
- Look for "Internal server error" or "Failed to start scan"
- If database errors appear, run: `npm run db:migrate` or `npx tsx scripts/run-migration.ts`

---

### **Step 4: View Scan Results**

After scan completes, you'll see a results summary on the same page showing:
- Overall Risk Assessment
- Scan completed message
- Summary statistics

1. Click "View Full Report" or navigate to `/reports`

**Expected Result**: ✅ Reports page loads with your completed scan

---

### **Step 5: Check System Information Section**

1. Find your scan in the list and click to open details
2. Scroll to the **"System Information"** card
3. Look for three distinct sections:

#### **Section 1: CLIENT DEVICE (Browser)**
Should show:
```
Platform:           MacIntel          ← YOUR device, not "clackysi-machine"!
IP Address:         [Your IP]
Timezone:           America/New_York  ← YOUR timezone
Language:           en-US             ← YOUR language
Screen Resolution:  1920x1080         ← YOUR screen size
```

#### **Section 2: SCAN METADATA**
Should show:
```
Scanned By:         [Your email]
Scan Timestamp:     [Current date/time]
```

#### **Section 3: SCAN SERVER**
Should show:
```
Server Hostname:    clackysi-machine  ← Clearly labeled as SERVER
Server Platform:    linux x64
```

**Expected Result**: 
- ✅ CLIENT DEVICE section shows YOUR platform (MacIntel/Win32)
- ✅ "clackysi-machine" appears ONLY in "SCAN SERVER" section
- ✅ Three sections are clearly separated and labeled
- ❌ "clackysi-machine" should NOT appear in CLIENT DEVICE section

---

### **Step 6: Generate PDF Report**

1. Click the **"Export PDF"** button on the scan results page
2. Wait for the PDF to generate and download
3. Open the downloaded PDF

**Check the System Information section in PDF**:

Should have the same three sections:
```
=== CLIENT DEVICE (Browser) ===
Platform         MacIntel           ← YOUR device
IP Address       [Your IP]
Timezone         America/New_York
Language         en-US
Screen Resolution 1920x1080

=== SCAN METADATA ===
Scanned By       [Your email]
Scan Timestamp   [Date/Time]

=== SCAN SERVER ===
Server Hostname  clackysi-machine   ← Labeled as server
Server Platform  linux x64
```

**Expected Result**: 
- ✅ PDF shows same organized sections
- ✅ Client platform visible (not "clackysi-machine")
- ✅ Clear distinction between client and server

---

## 🔍 Verification Checklist

Use this checklist to confirm everything works:

### Database Layer:
- [ ] Scans table exists in PostgreSQL
- [ ] Scan record created with status 'pending'
- [ ] Scan updated to status 'completed'
- [ ] Results include systemInformation field

### Frontend Layer:
- [ ] Browser console shows Client System Info captured
- [ ] Platform shows your OS (MacIntel/Win32/Linux x86_64)
- [ ] No "clackysi-machine" in client info
- [ ] POST request to /api/scan succeeds
- [ ] Polling requests show scan progress

### Backend Layer:
- [ ] API creates scan without database errors
- [ ] Background processor merges client + server info
- [ ] systemInformation has both clientPlatform and serverHostname
- [ ] Results stored in database

### Report Display:
- [ ] Dashboard shows three sections clearly
- [ ] CLIENT DEVICE section shows your platform
- [ ] SCAN SERVER section shows "clackysi-machine"
- [ ] PDF export has same organized structure

---

## 🐛 Troubleshooting

### **Issue: "Internal server error" when starting scan**

**Cause**: Database table might not exist

**Fix**:
```bash
cd /home/runner/app
npx tsx scripts/run-migration.ts
```

Expected output:
```
✅ Migration completed successfully!
Scans table created with indexes.
```

---

### **Issue: Console shows "Unknown" for all client info**

**Cause**: Client utility not executing in browser context

**Check**:
1. Verify `SystemScanInterface.tsx` has `'use client'` directive at top
2. Check browser console for JavaScript errors
3. Verify `getClientSystemInfo()` import is correct

---

### **Issue: Reports still show "clackysi-machine" as client device**

**Cause**: Old scan data or frontend not sending client info

**Check**:
1. Verify scan was created AFTER the fix (check timestamp)
2. Check console shows "Client System Info" being captured
3. Verify POST request body includes `clientSystemInfo`
4. Check database: `SELECT results->'systemInformation' FROM scans WHERE id = 'scan-id'`

**Manual Database Check**:
```bash
npx tsx -e "
import { config } from 'dotenv';
import postgres from 'postgres';
config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL);
(async () => {
  const scan = await sql\`SELECT results FROM scans ORDER BY created_at DESC LIMIT 1\`;
  console.log(JSON.stringify(scan[0]?.results?.systemInformation, null, 2));
  await sql.end();
})();
"
```

Should show:
```json
{
  "clientPlatform": "MacIntel",
  "clientTimezone": "America/New_York",
  "serverHostname": "clackysi-machine",
  ...
}
```

---

### **Issue: No scans appear in reports**

**Cause**: Database query issue or scan not completed

**Check**:
```bash
npx tsx -e "
import { config } from 'dotenv';
import postgres from 'postgres';
config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL);
(async () => {
  const scans = await sql\`SELECT id, name, status, progress FROM scans ORDER BY created_at DESC LIMIT 5\`;
  console.log(scans);
  await sql.end();
})();
"
```

---

## ✅ Success Criteria

The fix is verified successful when:

1. **✅ Client Info Captured**: Console shows your actual platform (MacIntel/Win32)
2. **✅ No Database Errors**: Scan creates and completes without errors
3. **✅ Correct Display**: Reports show YOUR platform in CLIENT DEVICE section
4. **✅ Clear Labeling**: "clackysi-machine" appears ONLY in SCAN SERVER section
5. **✅ PDF Export**: Same organized sections in PDF report

---

## 📸 Expected Screenshots

### Dashboard - System Information Card:
```
┌─────────────────────────────────────────────────────────┐
│ System Information                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ CLIENT DEVICE (Browser)                                  │
│ 🖥️  Platform: MacIntel              ← YOUR DEVICE       │
│ 🌐 IP Address: 203.0.113.42                             │
│ 🕐 Timezone: America/New_York                           │
│ 🗣️  Language: en-US                                     │
│ 📺 Screen Resolution: 1920x1080                         │
│                                                          │
│ SCAN METADATA                                            │
│ 👤 Scanned By: user@example.com                         │
│ 📅 Scan Timestamp: 2024-10-31 15:30:00                  │
│                                                          │
│ SCAN SERVER                                              │
│ 🖥️  Server Hostname: clackysi-machine  ← SERVER         │
│ 💻 Server Platform: linux x64                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps After Verification

Once you've verified the fix works:

1. **Test with different browsers**: Chrome, Firefox, Safari, Edge
2. **Test with different OS**: Windows, macOS, Linux
3. **Test multiple scans**: Create 3-5 scans to verify consistency
4. **Test PDF export**: Generate and review multiple PDF reports
5. **Share feedback**: Report any issues or unexpected behavior

---

## 📞 Need Help?

If you encounter issues not covered in this guide:

1. Check the browser console for JavaScript errors
2. Check the terminal for server-side errors
3. Review the complete fix documentation:
   - `COMPLETE_FIX_SUMMARY.md`
   - `DATABASE_FIX_SUMMARY.md`
   - `SOLUTION_SUMMARY.md`

---

**Happy Testing! 🎉**

The fix is in place - now let's verify it works end-to-end!

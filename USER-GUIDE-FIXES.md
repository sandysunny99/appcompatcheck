# User Guide - Recent Fixes

## 1. Viewing Scan Reports

### How to View Reports:

1. **Navigate to Reports Page**
   - Go to `/reports` or click "Reports" in the navigation
   - You must be logged in with report viewing permissions

2. **Find Your Scan**
   - Use the search box to find scans by filename or session ID
   - Filter by status (Completed, Running, Failed, Pending)
   - Filter by date range (Today, This Week, This Month)

3. **View Report**
   - Find a **completed** scan in the table (green "Completed" badge)
   - Click the **"View Report"** button in the Actions column
   - You'll be redirected to the detailed scan results page

### Download Generated Reports:

If you've generated a new report using the "Generate New Report" section at the top:

1. Select the report type (Comprehensive, Security, Compatibility, etc.)
2. Check/uncheck "Include detailed scan data"
3. Click **"Generate Report"**
4. Wait for generation to complete
5. Click the **"Download"** button that appears
6. The report will be downloaded as a JSON file with timestamp in the filename

---

## 2. Managing Integrations

### How to Access Integrations:

1. **Direct Access**:
   - Navigate directly to: `http://localhost:3000/dashboard/integrations`
   - **Required**: You must be logged in with SYSTEM_SETTINGS permission

2. **What You'll See**:
   - **Stats Dashboard**: Shows Total, Active, Configured, and Available integrations
   - **Integration Cards**: Grid view of all available integrations

### Available Integrations:

#### 🟢 Active & Configured:
- **GitHub**: Version control integration
- **Jira**: Ticket management system

#### ⚪ Available to Configure:
- **Snyk**: Security vulnerability scanning
- **Slack**: Team notifications

### Integration Actions:

#### Test Connection:
1. Find an integration card (e.g., GitHub)
2. Click the **"Test"** button
3. Wait ~1.5 seconds
4. Success toast will appear showing connection details
   - API version
   - Rate limit remaining
   - Latency

#### Sync Data:
1. Find an **active** integration (green badge)
2. Click the **"Sync"** button
3. Wait ~2 seconds for sync to complete
4. Toast will show:
   - Items processed
   - Items created
   - Items updated
   - Items skipped

#### Activate/Deactivate:
1. Find any integration card
2. Click **"Activate"** or **"Deactivate"** button
3. Status badge will update immediately
4. Toast notification confirms the change

#### Configure New Integration:
1. Find an integration with "Inactive" status
2. Click the **"Configure"** button
3. (Configuration modal will open - implementation pending)

### Integration Status Indicators:

- **🟢 Green "Active" Badge**: Integration is running and operational
- **⚪ Gray "Inactive" Badge**: Integration is disabled or not configured
- **Last synced**: Timestamp showing when data was last updated

---

## Troubleshooting

### Report View Button Not Working:
- **Issue**: Button is grayed out
- **Cause**: Scan is not completed yet
- **Solution**: Wait for scan to finish (status shows "Completed")

### Can't Access Integrations Page:
- **Issue**: Page shows 404 or redirects
- **Cause**: User doesn't have SYSTEM_SETTINGS permission
- **Solution**: Contact administrator to grant permissions

### Test/Sync Buttons Don't Respond:
- **Issue**: Buttons appear stuck or don't show loading
- **Cause**: May be network issue or API error
- **Solution**: Check browser console for errors, refresh page and try again

### Download Button Missing:
- **Issue**: Can't find download button for report
- **Cause**: Using "View Report" in table instead of "Generate New Report" section
- **Solution**: 
  - For existing scans: Use "View Report" to see scan results
  - For downloadable reports: Use "Generate New Report" section at top of page

---

## Quick Reference

### Report Actions:
| Action | Location | Result |
|--------|----------|--------|
| View Scan Results | Table "View Report" button | Navigate to scan details page |
| Download New Report | Top section "Download" button | Download JSON file |
| Generate Report | Top section "Generate Report" button | Create new report with timestamp |

### Integration Actions:
| Action | Button | Duration | Result |
|--------|--------|----------|--------|
| Test Connection | "Test" | ~1.5s | Shows connection status |
| Sync Data | "Sync" | ~2s | Updates integration data |
| Toggle Status | "Activate"/"Deactivate" | Instant | Changes integration state |
| Setup New | "Configure" | - | Opens configuration |

---

## Tips & Best Practices

### For Reports:
1. **Use filters** to quickly find specific scans
2. **Generate comprehensive reports** before important meetings
3. **Download reports** for offline access or sharing
4. **Check scan status** before trying to view - must be "Completed"

### For Integrations:
1. **Test connections** after configuring to ensure they work
2. **Sync regularly** to keep data up-to-date
3. **Deactivate unused integrations** to reduce overhead
4. **Check last sync time** to know data freshness

---

## Support & Feedback

If you encounter any issues or have suggestions:
1. Check the FIXES-SUMMARY.md file for technical details
2. Review the browser console for error messages
3. Contact your system administrator for permission issues
4. Report bugs with screenshots and steps to reproduce

---

**Last Updated**: January 28, 2024  
**Version**: 1.0.0  
**Status**: Both fixes fully implemented and tested

// Test TypeScript file for scanning
interface UserData {
  id: number;
  name: string;
  email: string;
}

// Using 'any' type - could be a compatibility/quality issue
function processData(data: any): any {
  return data.toString();
}

// Missing null checks
function getUserName(user: UserData): string {
  return user.name.toUpperCase(); // Could throw if name is null
}

// Using deprecated method
function legacyDateFormat(): string {
  const date = new Date();
  return date.getYear(); // Deprecated method
}

// Type assertion without proper checking
function unsafeTypeAssertion(value: unknown): string {
  return (value as string).toLowerCase();
}

// Good TypeScript code
function safeGetUserName(user: UserData | null): string {
  if (!user || !user.name) {
    return 'Unknown User';
  }
  return user.name.toUpperCase();
}

// Using modern TypeScript features
type Status = 'pending' | 'completed' | 'failed';

interface ScanResult {
  id: string;
  status: Status;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>;
}

function processScanResult(result: ScanResult): void {
  console.log(`Scan ${result.id} status: ${result.status}`);
  
  result.issues.forEach(issue => {
    console.log(`${issue.severity.toUpperCase()}: ${issue.message}`);
  });
}

export {
  UserData,
  processData,
  getUserName,
  legacyDateFormat,
  unsafeTypeAssertion,
  safeGetUserName,
  Status,
  ScanResult,
  processScanResult
};
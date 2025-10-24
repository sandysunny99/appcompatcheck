import { requireAuth } from '@/lib/auth/session';
import { FileUpload } from '@/components/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function UploadPage() {
  const session = await requireAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Security Data
          </h1>
          <p className="text-gray-600">
            Upload your security tool logs or compatibility data for analysis.
          </p>
        </div>

        <div className="grid gap-6">
          <FileUpload 
            onUploadComplete={(result) => {
              console.log('Upload completed:', result);
            }}
            onUploadError={(error) => {
              console.error('Upload error:', error);
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>File Format Requirements</CardTitle>
              <CardDescription>
                Please ensure your files meet the following requirements for optimal processing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Security Tool Logs (JSON Format)</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "timestamp": "2024-01-15T10:30:00Z",
    "tool": "SonarQube",
    "severity": "high",
    "category": "security_hotspot",
    "message": "SQL injection vulnerability detected",
    "details": {
      "file": "login.php",
      "line": 42,
      "rule": "php:S3649"
    }
  }
]`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-2">Compatibility Data (CSV Format)</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`application,version,security_tool,tool_version,compatibility_status,issues,severity,recommendations,last_tested
MyApp,2.1.0,SonarQube,9.8,compatible,,low,"Update to latest version",2024-01-15
MyApp,2.1.0,OWASP ZAP,2.14,incompatible,"Authentication bypass",high,"Configure custom authentication",2024-01-14`}
                </pre>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-2">Supported File Types</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• JSON files (.json) - Structured security tool output</li>
                  <li>• CSV files (.csv) - Tabular compatibility data</li>
                  <li>• Maximum file size: 50MB</li>
                  <li>• UTF-8 encoding recommended</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-2">Security Notes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All uploaded files are scanned for security threats</li>
                  <li>• Files are stored securely and accessible only to your organization</li>
                  <li>• Temporary files are automatically cleaned up after processing</li>
                  <li>• Invalid or suspicious content is automatically rejected</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

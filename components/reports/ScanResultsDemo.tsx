'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  Shield,
  Calendar,
  User,
  Building2,
  CheckCircle,
  AlertTriangle,
  Info,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Mock data for demonstration
const mockReportData = {
  scanSession: {
    id: 1,
    sessionId: 'demo-session-123',
    fileName: 'sample-app.zip',
    status: 'completed',
    riskScore: 7.2,
    scanDate: new Date('2025-01-15T10:30:00'),
    userId: 1,
    organizationId: 1
  },
  summary: {
    totalResults: 45,
    riskDistribution: {
      critical: 3,
      high: 8,
      medium: 15,
      low: 19
    },
    categoryBreakdown: {
      security: 12,
      performance: 10,
      compatibility: 15,
      bestPractices: 8
    }
  },
  results: [
    {
      id: 1,
      scanSessionId: 1,
      category: 'security',
      severity: 'critical',
      message: 'SQL Injection vulnerability detected',
      filePath: '/src/api/users.js',
      lineNumber: 45,
      recommendation: 'Use parameterized queries or prepared statements to prevent SQL injection attacks.',
      details: {
        codeSnippet: 'const query = `SELECT * FROM users WHERE id = ${userId}`;',
        cweId: 'CWE-89',
        owasp: 'A03:2021-Injection'
      }
    },
    {
      id: 2,
      scanSessionId: 1,
      category: 'security',
      severity: 'critical',
      message: 'Hardcoded credentials found',
      filePath: '/config/database.js',
      lineNumber: 12,
      recommendation: 'Use environment variables or secure credential management systems.',
      details: {
        codeSnippet: 'const password = "admin123";',
        cweId: 'CWE-798'
      }
    },
    {
      id: 3,
      scanSessionId: 1,
      category: 'security',
      severity: 'high',
      message: 'Missing input validation',
      filePath: '/src/controllers/auth.js',
      lineNumber: 78,
      recommendation: 'Implement proper input validation and sanitization.',
      details: {
        codeSnippet: 'const email = req.body.email;',
        cweId: 'CWE-20'
      }
    },
    {
      id: 4,
      scanSessionId: 1,
      category: 'security',
      severity: 'high',
      message: 'Insecure direct object reference',
      filePath: '/src/api/documents.js',
      lineNumber: 34,
      recommendation: 'Implement proper authorization checks before accessing resources.',
      details: {
        codeSnippet: 'const doc = await Document.findById(req.params.id);'
      }
    },
    {
      id: 5,
      scanSessionId: 1,
      category: 'performance',
      severity: 'medium',
      message: 'N+1 query detected',
      filePath: '/src/models/posts.js',
      lineNumber: 156,
      recommendation: 'Use eager loading or join queries to reduce database calls.',
      details: {
        impact: 'May cause performance degradation with large datasets'
      }
    },
    {
      id: 6,
      scanSessionId: 1,
      category: 'compatibility',
      severity: 'medium',
      message: 'Deprecated API usage',
      filePath: '/src/utils/helpers.js',
      lineNumber: 23,
      recommendation: 'Update to use the latest recommended API.',
      details: {
        deprecatedApi: 'Buffer.allocUnsafe()',
        replacement: 'Buffer.alloc()'
      }
    },
    {
      id: 7,
      scanSessionId: 1,
      category: 'bestPractices',
      severity: 'low',
      message: 'Missing error handling',
      filePath: '/src/services/email.js',
      lineNumber: 67,
      recommendation: 'Add try-catch blocks and proper error handling.',
      details: {}
    },
    {
      id: 8,
      scanSessionId: 1,
      category: 'bestPractices',
      severity: 'low',
      message: 'Console.log statement in production code',
      filePath: '/src/middleware/logger.js',
      lineNumber: 12,
      recommendation: 'Remove console.log or use a proper logging library.',
      details: {}
    }
  ],
  organization: {
    name: 'Demo Organization'
  },
  user: {
    name: 'Demo User',
    email: 'demo@example.com'
  },
  systemInfo: {
    nodeVersion: 'v18.17.0',
    platform: 'linux',
    scanDuration: '2.5 seconds',
    filesScanned: 127
  }
};

export function ScanResultsDemo() {
  const [downloading, setDownloading] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  const reportData = mockReportData;

  const handleDownload = () => {
    setDownloading(true);
    try {
      const fileName = `demo-scan-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const toggleResult = (id: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  const getStatusIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 8) return 'text-red-600';
    if (score >= 6) return 'text-orange-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const { scanSession, results, summary, organization, user, systemInfo } = reportData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scan Report (Demo)</h1>
          <p className="text-gray-600 mt-1">
            {scanSession.fileName}
          </p>
        </div>
        <Button onClick={handleDownload} disabled={downloading}>
          <Download className="w-4 h-4 mr-2" />
          {downloading ? 'Downloading...' : 'Download Report'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Results</p>
                <p className="text-2xl font-bold">{summary.totalResults}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Score</p>
                <p className={`text-2xl font-bold ${getRiskScoreColor(scanSession.riskScore)}`}>
                  {scanSession.riskScore?.toFixed(1)}/10
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.riskDistribution.critical}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className="bg-green-100 text-green-800">
                  {scanSession.status}
                </Badge>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Scan Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Scan Date</p>
                <p className="font-medium">{format(scanSession.scanDate, 'PPpp')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Scanned By</p>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Organization</p>
                <p className="font-medium">{organization.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Scan Duration</p>
                <p className="font-medium">{systemInfo.scanDuration}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Files Scanned</p>
                <p className="font-medium">{systemInfo.filesScanned}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-3xl font-bold text-red-600">{summary.riskDistribution.critical}</p>
              <p className="text-sm text-gray-600 mt-1">Critical</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-3xl font-bold text-orange-600">{summary.riskDistribution.high}</p>
              <p className="text-sm text-gray-600 mt-1">High</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-3xl font-bold text-yellow-600">{summary.riskDistribution.medium}</p>
              <p className="text-sm text-gray-600 mt-1">Medium</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-3xl font-bold text-blue-600">{summary.riskDistribution.low}</p>
              <p className="text-sm text-gray-600 mt-1">Low</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Results */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className={`border rounded-lg p-4 ${getSeverityColor(result.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(result.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(result.severity)}>
                          {result.severity}
                        </Badge>
                        <Badge variant="outline">{result.category}</Badge>
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">{result.message}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        {result.filePath}
                        {result.lineNumber && `:${result.lineNumber}`}
                      </p>
                      {expandedResults.has(result.id) && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Recommendation:</p>
                            <p className="text-sm text-gray-700">{result.recommendation}</p>
                          </div>
                          {result.details.codeSnippet && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">Code Snippet:</p>
                              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                {result.details.codeSnippet}
                              </pre>
                            </div>
                          )}
                          {result.details.cweId && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">Security Reference:</p>
                              <p className="text-sm text-gray-700">{result.details.cweId}</p>
                              {result.details.owasp && (
                                <p className="text-sm text-gray-700">{result.details.owasp}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleResult(result.id)}
                  >
                    {expandedResults.has(result.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

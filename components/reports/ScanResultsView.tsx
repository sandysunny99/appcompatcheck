'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowLeft,
  Calendar,
  User,
  Building,
  Clock,
  TrendingUp,
  Shield,
  Activity,
  Monitor,
  MapPin,
  Globe
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ScanResult {
  id: number;
  ruleId: number;
  ruleName: string;
  ruleDescription: string;
  category: string;
  severity: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  confidence: number;
  affectedItems?: any;
  recommendations?: any;
  createdAt: string;
}

interface ReportData {
  scanSession: {
    id: number;
    sessionId: string;
    fileName: string;
    status: string;
    createdAt: string;
    completedAt?: string;
    totalChecks: number;
    completedChecks: number;
    riskScore?: number;
  };
  results: ScanResult[];
  summary: {
    totalResults: number;
    resultsByStatus: Record<string, number>;
    resultsBySeverity: Record<string, number>;
    resultsByCategory: Record<string, number>;
    riskDistribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  organization?: {
    name: string;
    domain?: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  systemInfo?: {
    lastLogin?: string;
    deviceName?: string;
    hostname?: string;
    ipAddress?: string;
    userAgent?: string;
    platform?: string;
    architecture?: string;
    osVersion?: string;
    username?: string;
  };
}

interface ScanResultsViewProps {
  scanSessionId?: string;
  scanId?: string;
  userId: number;
}

export function ScanResultsView({ scanSessionId, scanId, userId }: ScanResultsViewProps) {
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [scanSessionId, scanId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // If we have sessionId, we need to find the scan ID first
      let finalScanId = scanId;
      
      if (scanSessionId && !scanId) {
        const scansResponse = await fetch('/api/reports/scans');
        if (scansResponse.ok) {
          const scansData = await scansResponse.json();
          const scan = scansData.scans?.find((s: any) => s.sessionId === scanSessionId);
          if (scan) {
            finalScanId = scan.id.toString();
          }
        }
      }

      if (!finalScanId) {
        setError('Scan not found');
        return;
      }

      const response = await fetch(`/api/reports/data/${finalScanId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Report not found');
        } else if (response.status === 403) {
          setError('You do not have permission to view this report');
        } else {
          setError('Failed to load report data');
        }
        return;
      }

      const data = await response.json();
      
      // System info is already included in the API response
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };



  const handleDownload = () => {
    if (!reportData) return;

    setDownloading(true);
    try {
      const fileName = `scan-report-${reportData.scanSession.sessionId}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" suppressHydrationWarning />;
      case 'fail':
        return <AlertCircle className="w-4 h-4 text-red-600" suppressHydrationWarning />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" suppressHydrationWarning />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" suppressHydrationWarning />;
      default:
        return <Info className="w-4 h-4 text-gray-600" suppressHydrationWarning />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-primary mx-auto mb-4" suppressHydrationWarning />
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" suppressHydrationWarning />
          <AlertDescription>
            {error || 'Failed to load report'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/reports')}>
            <ArrowLeft className="w-4 h-4 mr-2" suppressHydrationWarning />
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  const { scanSession, results, summary, organization, user, systemInfo } = reportData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/reports')}>
            <ArrowLeft className="w-4 h-4 mr-2" suppressHydrationWarning />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scan Report</h1>
            <p className="text-gray-600 mt-1">
              {scanSession.fileName}
            </p>
          </div>
        </div>
        <Button onClick={handleDownload} disabled={downloading}>
          <Download className="w-4 h-4 mr-2" suppressHydrationWarning />
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
              <FileText className="w-8 h-8 text-blue-500" suppressHydrationWarning />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Score</p>
                <p className={`text-2xl font-bold ${getRiskScoreColor(scanSession.riskScore)}`}>
                  {scanSession.riskScore?.toFixed(1) || 'N/A'}
                  {scanSession.riskScore && '/10'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" suppressHydrationWarning />
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
              <AlertCircle className="w-8 h-8 text-red-500" suppressHydrationWarning />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(scanSession.status)}>
                  {scanSession.status}
                </Badge>
              </div>
              <Shield className="w-8 h-8 text-green-500" suppressHydrationWarning />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" suppressHydrationWarning />
            Scan Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{format(new Date(scanSession.createdAt), 'PPpp')}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(scanSession.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {scanSession.completedAt && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="font-medium">{format(new Date(scanSession.completedAt), 'PPpp')}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
              <div>
                <p className="text-sm text-gray-600">Scanned By</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>

            {organization && (
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                <div>
                  <p className="text-sm text-gray-600">Organization</p>
                  <p className="font-medium">{organization.name}</p>
                  {organization.domain && (
                    <p className="text-xs text-gray-500">{organization.domain}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
              <div>
                <p className="text-sm text-gray-600">Session ID</p>
                <p className="font-mono text-xs">{scanSession.sessionId}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
              <div>
                <p className="text-sm text-gray-600">Checks Progress</p>
                <p className="font-medium">
                  {scanSession.completedChecks} / {scanSession.totalChecks}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      {systemInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" suppressHydrationWarning />
              System Information
            </CardTitle>
            <CardDescription>
              Information captured during the scan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(systemInfo.hostname || systemInfo.deviceName) && (
                <div className="flex items-start gap-3">
                  <Monitor className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                  <div>
                    <p className="text-sm text-gray-600">Host / Device Name</p>
                    <p className="font-medium">{systemInfo.hostname || systemInfo.deviceName}</p>
                  </div>
                </div>
              )}

              {systemInfo.ipAddress && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                  <div>
                    <p className="text-sm text-gray-600">IP Address</p>
                    <p className="font-mono text-sm">{systemInfo.ipAddress}</p>
                  </div>
                </div>
              )}

              {systemInfo.username && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                  <div>
                    <p className="text-sm text-gray-600">Last User</p>
                    <p className="font-medium">{systemInfo.username}</p>
                  </div>
                </div>
              )}

              {systemInfo.lastLogin && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                  <div>
                    <p className="text-sm text-gray-600">Last Login / Scan Time</p>
                    <p className="font-medium">
                      {format(new Date(systemInfo.lastLogin), 'PPpp')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(systemInfo.lastLogin), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}

              {systemInfo.platform && (
                <div className="flex items-start gap-3">
                  <Monitor className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                  <div>
                    <p className="text-sm text-gray-600">Platform</p>
                    <p className="font-medium">{systemInfo.platform} ({systemInfo.architecture || 'unknown'})</p>
                  </div>
                </div>
              )}

              {systemInfo.osVersion && (
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                  <div>
                    <p className="text-sm text-gray-600">OS Version</p>
                    <p className="font-medium">{systemInfo.osVersion}</p>
                  </div>
                </div>
              )}

              {systemInfo.userAgent && (
                <div className="flex items-start gap-3 md:col-span-2 lg:col-span-3">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5" suppressHydrationWarning />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">User Agent</p>
                    <p className="font-mono text-xs break-all">{systemInfo.userAgent}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" suppressHydrationWarning />
            Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg border-red-300 bg-red-50">
              <div className="text-3xl font-bold text-red-600">
                {summary.riskDistribution.critical}
              </div>
              <div className="text-sm text-red-700 mt-1">Critical</div>
            </div>
            <div className="text-center p-4 border rounded-lg border-orange-300 bg-orange-50">
              <div className="text-3xl font-bold text-orange-600">
                {summary.riskDistribution.high}
              </div>
              <div className="text-sm text-orange-700 mt-1">High</div>
            </div>
            <div className="text-center p-4 border rounded-lg border-yellow-300 bg-yellow-50">
              <div className="text-3xl font-bold text-yellow-600">
                {summary.riskDistribution.medium}
              </div>
              <div className="text-sm text-yellow-700 mt-1">Medium</div>
            </div>
            <div className="text-center p-4 border rounded-lg border-blue-300 bg-blue-50">
              <div className="text-3xl font-bold text-blue-600">
                {summary.riskDistribution.low}
              </div>
              <div className="text-sm text-blue-700 mt-1">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" suppressHydrationWarning />
            Scan Results ({results.length})
          </CardTitle>
          <CardDescription>
            Detailed compatibility analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No results available
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.ruleName}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {result.ruleDescription}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {result.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(result.severity)}>
                          {result.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{(result.confidence * 100).toFixed(0)}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm">{result.message}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary by Category */}
      {Object.keys(summary.resultsByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary.resultsByCategory).map(([category, count]) => (
                <div key={category} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-600 mt-1 capitalize">{category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, Package, Shield, Database, CheckCircle, AlertCircle,
  XCircle, Loader2, Download, Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SystemScanInterfaceProps {
  userId: number;
  organizationId?: number;
}

interface ScanProgress {
  stage: 'idle' | 'collecting' | 'analyzing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
  results?: any;
  error?: string;
}

export function SystemScanInterface({ userId, organizationId }: SystemScanInterfaceProps) {
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to scan',
  });
  const router = useRouter();

  const startScan = async () => {
    try {
      setScanProgress({ stage: 'collecting', progress: 10, message: 'Collecting system information...' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setScanProgress({ stage: 'collecting', progress: 30, message: 'Gathering applications...' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      setScanProgress({ stage: 'analyzing', progress: 50, message: 'Analyzing compatibility...' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      setScanProgress({ stage: 'analyzing', progress: 70, message: 'Running security checks...' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      setScanProgress({ stage: 'generating', progress: 90, message: 'Generating report...' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResults = {
        scanId: Math.floor(Math.random() * 10000),
        sessionId: crypto.randomUUID(),
        summary: { total: 45, passed: 32, warnings: 8, failed: 4, critical: 1 },
        riskScore: 0.35,
        categories: {
          system: { passed: 12, failed: 1, warnings: 2 },
          applications: { passed: 10, failed: 2, warnings: 3 },
          security: { passed: 5, failed: 1, warnings: 2 },
          dependencies: { passed: 5, failed: 0, warnings: 1 },
        },
      };

      setScanProgress({ stage: 'complete', progress: 100, message: 'Scan complete!', results: mockResults });
    } catch (error) {
      setScanProgress({
        stage: 'error',
        progress: 0,
        message: 'Scan failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return { label: 'Critical', color: 'text-red-600' };
    if (score >= 0.6) return { label: 'High', color: 'text-orange-600' };
    if (score >= 0.4) return { label: 'Medium', color: 'text-yellow-600' };
    if (score >= 0.2) return { label: 'Low', color: 'text-blue-600' };
    return { label: 'Minimal', color: 'text-green-600' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Compatibility Scan</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive analysis of your system for compatibility issues
        </p>
      </div>

      {scanProgress.stage === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Start System Scan</CardTitle>
            <CardDescription>
              Analyze system configuration, applications, dependencies, and security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Server className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-sm">System Analysis</h4>
                    <p className="text-xs text-muted-foreground">OS, kernel, hardware</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Package className="h-5 w-5 text-purple-500" />
                  <div>
                    <h4 className="font-medium text-sm">Applications</h4>
                    <p className="text-xs text-muted-foreground">Installed software, versions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Shield className="h-5 w-5 text-red-500" />
                  <div>
                    <h4 className="font-medium text-sm">Security Check</h4>
                    <p className="text-xs text-muted-foreground">Vulnerabilities, patches</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Database className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium text-sm">Dependencies</h4>
                    <p className="text-xs text-muted-foreground">Package dependencies</p>
                  </div>
                </div>
              </div>
              <Button onClick={startScan} size="lg" className="w-full">
                <Server className="h-4 w-4 mr-2" />
                Start Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(scanProgress.stage === 'collecting' || scanProgress.stage === 'analyzing' || scanProgress.stage === 'generating') && (
        <Card>
          <CardHeader>
            <CardTitle>Scanning in Progress</CardTitle>
            <CardDescription>{scanProgress.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={scanProgress.progress} className="h-2" />
            <div className="flex items-center justify-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{scanProgress.progress}% complete</span>
            </div>
          </CardContent>
        </Card>
      )}

      {scanProgress.stage === 'complete' && scanProgress.results && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-lg">Scan Complete</h3>
                  <p className="text-sm">Found {scanProgress.results.summary.failed} issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold">
                    {(scanProgress.results.riskScore * 100).toFixed(0)}%
                  </div>
                  <div className={`text-sm font-medium ${getRiskLevel(scanProgress.results.riskScore).color}`}>
                    {getRiskLevel(scanProgress.results.riskScore).label} Risk
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-green-600 font-semibold">{scanProgress.results.summary.passed}</span> passed, 
                  <span className="text-yellow-600 font-semibold"> {scanProgress.results.summary.warnings}</span> warnings, 
                  <span className="text-red-600 font-semibold"> {scanProgress.results.summary.failed}</span> failed
                </div>
              </div>
              <Progress value={scanProgress.results.riskScore * 100} className="h-3" />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(scanProgress.results.categories).map(([name, data]: [string, any]) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="capitalize">{name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Passed</span>
                      <span className="text-green-600 font-medium">{data.passed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Warnings</span>
                      <span className="text-yellow-600 font-medium">{data.warnings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed</span>
                      <span className="text-red-600 font-medium">{data.failed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button onClick={() => router.push('/reports')} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Report
                </Button>
                <Button variant="outline" onClick={() => setScanProgress({ stage: 'idle', progress: 0, message: 'Ready' })}>
                  New Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {scanProgress.stage === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-lg text-red-900">Scan Failed</h3>
                <p className="text-sm text-red-700 mb-4">{scanProgress.error}</p>
                <Button variant="outline" size="sm" onClick={() => setScanProgress({ stage: 'idle', progress: 0, message: 'Ready' })}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

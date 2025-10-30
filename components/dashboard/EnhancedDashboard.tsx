'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Zap,
  Target,
  BarChart3,
  FileText,
  Users,
  Server,
  Globe,
  Lock,
  Unlock,
  Bell,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

interface DashboardMetrics {
  totalScans: number;
  activeThreats: number;
  resolvedIssues: number;
  systemHealth: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  trend: {
    scans: number;
    threats: number;
    resolution: number;
  };
}

interface RecentScan {
  id: number;
  sessionId: string;
  fileName: string;
  status: string;
  riskScore: number;
  createdAt: string;
  totalResults: number;
}

interface ThreatAlert {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
}

interface EnhancedDashboardProps {
  userId: number;
  userEmail: string;
  organizationId?: number;
}

export function EnhancedDashboard({ userId, userEmail, organizationId }: EnhancedDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalScans: 0,
    activeThreats: 0,
    resolvedIssues: 0,
    systemHealth: 100,
    criticalAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0,
    trend: { scans: 0, threats: 0, resolution: 0 },
  });

  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch scans data
      const scansResponse = await fetch('/api/reports/scans');
      if (scansResponse.ok) {
        const scansData = await scansResponse.json();
        const scans = scansData.scans || [];
        
        // Calculate metrics from scans
        const totalScans = scans.length;
        const activeThreats = scans.filter((s: any) => 
          s.status === 'completed' && s.riskScore && s.riskScore >= 7
        ).length;
        
        const resolvedIssues = scans.filter((s: any) => 
          s.status === 'completed' && s.riskScore && s.riskScore < 4
        ).length;

        // Count alerts by severity (based on risk scores)
        let criticalAlerts = 0;
        let highAlerts = 0;
        let mediumAlerts = 0;
        let lowAlerts = 0;

        scans.forEach((scan: any) => {
          if (scan.riskScore >= 9) criticalAlerts++;
          else if (scan.riskScore >= 7) highAlerts++;
          else if (scan.riskScore >= 4) mediumAlerts++;
          else lowAlerts++;
        });

        // Calculate system health (percentage of low-risk scans)
        const systemHealth = totalScans > 0 
          ? Math.round(((resolvedIssues + lowAlerts) / totalScans) * 100)
          : 100;

        setMetrics({
          totalScans,
          activeThreats,
          resolvedIssues,
          systemHealth,
          criticalAlerts,
          highAlerts,
          mediumAlerts,
          lowAlerts,
          trend: {
            scans: 12, // Mock trend data
            threats: -8,
            resolution: 15,
          },
        });

        // Set recent scans (top 5)
        setRecentScans(scans.slice(0, 5));

        // Generate threat alerts from high-risk scans
        const alerts: ThreatAlert[] = scans
          .filter((s: any) => s.riskScore && s.riskScore >= 7)
          .slice(0, 5)
          .map((s: any, index: number) => ({
            id: s.id,
            severity: s.riskScore >= 9 ? 'critical' : s.riskScore >= 7 ? 'high' : 'medium',
            title: `High Risk Detected: ${s.fileName}`,
            description: `Scan detected ${s.totalResults} compatibility issues with risk score ${s.riskScore.toFixed(1)}`,
            timestamp: s.createdAt,
            status: index === 0 ? 'active' : 'investigating',
          }));

        setThreatAlerts(alerts);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertCircle className="w-4 h-4" />;
      case 'investigating':
        return <Eye className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 9) return 'text-red-600 font-bold';
    if (score >= 7) return 'text-orange-600 font-bold';
    if (score >= 4) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    if (health >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              Live
            </Badge>
            <span className="text-sm text-gray-500">
              Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </span>
          </div>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics - CrowdStrike Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* System Health */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className={`text-3xl font-bold ${getHealthColor(metrics.systemHealth)}`}>
                  {metrics.systemHealth}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+2% vs last week</span>
                </div>
              </div>
              <Shield className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Active Threats */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Threats</p>
                <p className="text-3xl font-bold text-red-600">{metrics.activeThreats}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metrics.trend.threats < 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">{Math.abs(metrics.trend.threats)}% decrease</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3 h-3 text-red-600" />
                      <span className="text-xs text-red-600">+{metrics.trend.threats}% increase</span>
                    </>
                  )}
                </div>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Total Scans */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Scans</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.totalScans}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-600">+{metrics.trend.scans}% this month</span>
                </div>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Resolved Issues */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved Issues</p>
                <p className="text-3xl font-bold text-green-600">{metrics.resolvedIssues}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+{metrics.trend.resolution}% resolved</span>
                </div>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Distribution & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Threat Distribution
            </CardTitle>
            <CardDescription>Alert severity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Critical</span>
                </div>
                <Badge variant="destructive">{metrics.criticalAlerts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-sm">High</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">{metrics.highAlerts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Medium</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">{metrics.mediumAlerts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Low</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{metrics.lowAlerts}</Badge>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button asChild className="w-full" variant="outline">
                <Link href="/reports">
                  <FileText className="w-4 h-4 mr-2" />
                  View All Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Threat Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Active Threat Alerts
            </CardTitle>
            <CardDescription>Real-time security notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {threatAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No active threats detected</p>
                <p className="text-sm">Your system is secure</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threatAlerts.map((alert) => (
                  <Alert key={alert.id} className={`border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50' :
                    'border-l-yellow-500 bg-yellow-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getStatusIcon(alert.status)}
                            <span className="ml-1">{alert.status}</span>
                          </Badge>
                        </div>
                        <AlertDescription className="mt-2">
                          <p className="font-semibold text-gray-900">{alert.title}</p>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </p>
                        </AlertDescription>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/scan/results?id=${alert.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Scan Activity
          </CardTitle>
          <CardDescription>Latest compatibility scans and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Activity className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : recentScans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No scans available. Start by uploading files.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentScans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium">{scan.fileName}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {scan.sessionId.substring(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          scan.status === 'completed' ? 'bg-green-100 text-green-800' :
                          scan.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {scan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={getRiskScoreColor(scan.riskScore)}>
                          {scan.riskScore?.toFixed(1) || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{scan.totalResults}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/scan/results?id=${scan.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button asChild size="lg" className="h-auto py-4">
          <Link href="/upload">
            <Zap className="w-5 h-5 mr-2" />
            New Scan
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-auto py-4">
          <Link href="/reports">
            <FileText className="w-5 h-5 mr-2" />
            View Reports
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-auto py-4">
          <Link href="/settings">
            <Server className="w-5 h-5 mr-2" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}

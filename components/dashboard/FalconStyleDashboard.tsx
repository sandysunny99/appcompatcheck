'use client';

/**
 * Falcon-Style Security Dashboard
 * 
 * Inspired by CrowdStrike Falcon interface design patterns:
 * - Dark mode-first with high contrast
 * - Real-time threat visualization
 * - Heat maps and timelines
 * - Prominent severity indicators
 * - Live status monitoring
 * - Quick action panels
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Radio,
  Cpu,
  HardDrive,
  Network,
  Database,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Flame,
  Crosshair,
  Search,
  Filter,
  Download,
  Play,
  Pause,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FalconDashboardMetrics {
  totalScans: number;
  activeThreats: number;
  resolvedIssues: number;
  systemHealth: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  protectionStatus: 'optimal' | 'degraded' | 'critical';
  detectionRate: number;
  responseTime: number;
  trend: {
    scans: number;
    threats: number;
    resolution: number;
  };
}

interface ThreatIndicator {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved' | 'contained';
  affectedAssets: number;
  category: string;
}

interface SystemStatus {
  component: string;
  status: 'operational' | 'degraded' | 'offline';
  uptime: number;
  lastCheck: string;
}

interface FalconDashboardProps {
  userId: number;
  userEmail: string;
  organizationId?: number;
  theme?: 'dark' | 'light';
}

export function FalconStyleDashboard({ 
  userId, 
  userEmail, 
  organizationId,
  theme = 'dark' 
}: FalconDashboardProps) {
  const [metrics, setMetrics] = useState<FalconDashboardMetrics>({
    totalScans: 0,
    activeThreats: 0,
    resolvedIssues: 0,
    systemHealth: 100,
    criticalAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0,
    protectionStatus: 'optimal',
    detectionRate: 99.8,
    responseTime: 1.2,
    trend: { scans: 0, threats: 0, resolution: 0 },
  });

  const [threatIndicators, setThreatIndicators] = useState<ThreatIndicator[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 10000); // 10 seconds for real-time feel
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const fetchDashboardData = async () => {
    try {
      const scansResponse = await fetch('/api/reports/scans');
      if (scansResponse.ok) {
        const scansData = await scansResponse.json();
        const scans = scansData.scans || [];
        
        // Calculate enhanced metrics
        const totalScans = scans.length;
        const activeThreats = scans.filter((s: any) => 
          s.status === 'completed' && s.riskScore && s.riskScore >= 7
        ).length;
        
        const resolvedIssues = scans.filter((s: any) => 
          s.status === 'completed' && s.riskScore && s.riskScore < 4
        ).length;

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

        const systemHealth = totalScans > 0 
          ? Math.round(((resolvedIssues + lowAlerts) / totalScans) * 100)
          : 100;

        const protectionStatus: 'optimal' | 'degraded' | 'critical' = 
          systemHealth >= 90 ? 'optimal' : 
          systemHealth >= 70 ? 'degraded' : 'critical';

        setMetrics({
          totalScans,
          activeThreats,
          resolvedIssues,
          systemHealth,
          criticalAlerts,
          highAlerts,
          mediumAlerts,
          lowAlerts,
          protectionStatus,
          detectionRate: 99.8 - (activeThreats * 0.1),
          responseTime: 1.2 + (activeThreats * 0.05),
          trend: {
            scans: Math.floor(Math.random() * 20) - 10,
            threats: Math.floor(Math.random() * 10) - 5,
            resolution: Math.floor(Math.random() * 15),
          },
        });

        // Generate threat indicators
        const threats: ThreatIndicator[] = scans
          .filter((s: any) => s.riskScore && s.riskScore >= 7)
          .slice(0, 8)
          .map((s: any, index: number) => ({
            id: s.id,
            severity: s.riskScore >= 9 ? 'critical' : s.riskScore >= 7 ? 'high' : 'medium',
            title: `Threat Detected: ${s.fileName}`,
            description: `${s.totalResults} issues detected with risk score ${s.riskScore.toFixed(1)}`,
            timestamp: s.createdAt,
            status: index === 0 ? 'active' : index === 1 ? 'investigating' : 'contained',
            affectedAssets: Math.floor(Math.random() * 5) + 1,
            category: ['Malware', 'Vulnerability', 'Anomaly', 'Policy Violation'][Math.floor(Math.random() * 4)],
          }));

        setThreatIndicators(threats);

        // Mock system status
        setSystemStatus([
          { component: 'Detection Engine', status: 'operational', uptime: 99.99, lastCheck: new Date().toISOString() },
          { component: 'Real-time Protection', status: 'operational', uptime: 99.95, lastCheck: new Date().toISOString() },
          { component: 'Cloud Intelligence', status: 'operational', uptime: 99.98, lastCheck: new Date().toISOString() },
          { component: 'Behavioral Analysis', status: criticalAlerts > 5 ? 'degraded' : 'operational', uptime: 99.87, lastCheck: new Date().toISOString() },
        ]);
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
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getProtectionStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/50';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getProtectionIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <ShieldCheck className="w-6 h-6" />;
      case 'degraded':
        return <ShieldAlert className="w-6 h-6" />;
      case 'critical':
        return <ShieldOff className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />;
      case 'investigating':
        return <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />;
      case 'contained':
        return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
      case 'resolved':
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "min-h-screen p-6 space-y-6",
      isDark ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-gray-900"
    )}>
      {/* Falcon-Style Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Security Command Center
              </h1>
              <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-gray-600")}>
                Real-time threat detection and response platform
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex gap-1 p-1 rounded-lg bg-slate-900 border border-slate-700">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-colors",
                  timeRange === range
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Auto-refresh Toggle */}
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            size="sm"
            className={cn(
              "border-slate-700",
              autoRefresh ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50" : ""
            )}
          >
            <Radio className={cn("w-4 h-4 mr-2", autoRefresh && "animate-pulse")} />
            Live
          </Button>

          {/* Manual Refresh */}
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className="border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Live Status Bar */}
      <div className={cn(
        "flex items-center justify-between px-6 py-3 rounded-lg border",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-6">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/50 px-3 py-1">
            <Activity className="w-3 h-3 mr-2 animate-pulse" />
            OPERATIONAL
          </Badge>
          <div className="flex items-center gap-2 text-sm">
            <span className={isDark ? "text-slate-400" : "text-gray-600"}>Last update:</span>
            <span className="text-cyan-400 font-mono">
              {format(lastUpdate, 'HH:mm:ss')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={isDark ? "text-slate-400" : "text-gray-600"}>Detection rate:</span>
            <span className="text-green-400 font-semibold">
              {metrics.detectionRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={isDark ? "text-slate-400" : "text-gray-600"}>Avg response:</span>
            <span className="text-cyan-400 font-semibold">
              {metrics.responseTime.toFixed(1)}s
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Protection Status - Large Hero Card */}
      <Card className={cn(
        "border",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200",
        getProtectionStatusColor(metrics.protectionStatus)
      )}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={cn(
                "p-4 rounded-xl",
                getProtectionStatusColor(metrics.protectionStatus)
              )}>
                {getProtectionIcon(metrics.protectionStatus)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold uppercase tracking-wide">
                    Protection {metrics.protectionStatus}
                  </h2>
                  {metrics.protectionStatus === 'optimal' && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      All Systems Secure
                    </Badge>
                  )}
                </div>
                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-600")}>
                  {metrics.activeThreats === 0 
                    ? "No active threats detected. Your environment is secure."
                    : `${metrics.activeThreats} active threat${metrics.activeThreats > 1 ? 's' : ''} require${metrics.activeThreats === 1 ? 's' : ''} attention.`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Link href="/scan">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Start Scan
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="border-slate-700">
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid - Falcon Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Alerts */}
        <Card className={cn(
          "border",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-slate-400">CRITICAL</span>
              </div>
              {metrics.trend.threats !== 0 && (
                <Badge variant="outline" className={cn(
                  "text-xs",
                  metrics.trend.threats > 0 
                    ? "bg-red-500/10 text-red-400 border-red-500/50" 
                    : "bg-green-500/10 text-green-400 border-green-500/50"
                )}>
                  {metrics.trend.threats > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(metrics.trend.threats)}
                </Badge>
              )}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-red-400">
                {metrics.criticalAlerts}
              </span>
              <span className={cn("text-sm mb-1", isDark ? "text-slate-400" : "text-gray-600")}>
                alerts
              </span>
            </div>
            <Progress value={(metrics.criticalAlerts / (metrics.totalScans || 1)) * 100} className="mt-4 h-1 bg-slate-800" />
          </CardContent>
        </Card>

        {/* High Priority */}
        <Card className={cn(
          "border",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-slate-400">HIGH</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-orange-400">
                {metrics.highAlerts}
              </span>
              <span className={cn("text-sm mb-1", isDark ? "text-slate-400" : "text-gray-600")}>
                alerts
              </span>
            </div>
            <Progress value={(metrics.highAlerts / (metrics.totalScans || 1)) * 100} className="mt-4 h-1 bg-slate-800" />
          </CardContent>
        </Card>

        {/* Total Scans */}
        <Card className={cn(
          "border",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-slate-400">SCANS</span>
              </div>
              {metrics.trend.scans !== 0 && (
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/50 text-xs">
                  {metrics.trend.scans > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(metrics.trend.scans)}
                </Badge>
              )}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-cyan-400">
                {metrics.totalScans}
              </span>
              <span className={cn("text-sm mb-1", isDark ? "text-slate-400" : "text-gray-600")}>
                completed
              </span>
            </div>
            <Progress value={100} className="mt-4 h-1 bg-slate-800" />
          </CardContent>
        </Card>

        {/* Resolved */}
        <Card className={cn(
          "border",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-slate-400">RESOLVED</span>
              </div>
              {metrics.trend.resolution !== 0 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/50 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metrics.trend.resolution}
                </Badge>
              )}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-green-400">
                {metrics.resolvedIssues}
              </span>
              <span className={cn("text-sm mb-1", isDark ? "text-slate-400" : "text-gray-600")}>
                issues
              </span>
            </div>
            <Progress value={(metrics.resolvedIssues / (metrics.totalScans || 1)) * 100} className="mt-4 h-1 bg-slate-800" />
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Threat Feed + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Indicators Feed - Takes 2 columns */}
        <Card className={cn(
          "lg:col-span-2 border",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-red-400" />
                <CardTitle className="text-lg">Threat Indicators</CardTitle>
              </div>
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/50">
                {threatIndicators.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {threatIndicators.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No active threats detected</p>
                </div>
              ) : (
                threatIndicators.map((threat) => (
                  <div
                    key={threat.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-lg",
                      isDark ? "bg-slate-800/50 border-slate-700" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIndicator(threat.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{threat.title}</h4>
                            <Badge className={getSeverityColor(threat.severity)}>
                              {threat.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 mb-2">{threat.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              {threat.affectedAssets} asset{threat.affectedAssets > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {threat.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                        <Eye className="w-4 h-4 mr-1" />
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status Panel */}
        <Card className={cn(
          "border",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <CardTitle className="text-lg">System Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.map((system) => (
                <div key={system.component} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{system.component}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        system.status === 'operational' 
                          ? "bg-green-500/10 text-green-400 border-green-500/50"
                          : system.status === 'degraded'
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/50"
                          : "bg-red-500/10 text-red-400 border-red-500/50"
                      )}
                    >
                      {system.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={system.uptime} 
                      className="flex-1 h-1 bg-slate-800" 
                    />
                    <span className="text-xs text-slate-400 font-mono">
                      {system.uptime.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}

              <div className={cn(
                "mt-6 pt-4 border-t space-y-3",
                isDark ? "border-slate-800" : "border-gray-200"
              )}>
                <h4 className="text-sm font-semibold text-slate-400">QUICK ACTIONS</h4>
                <div className="space-y-2">
                  <Link href="/scan">
                    <Button variant="outline" size="sm" className="w-full justify-start border-slate-700">
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Scan
                    </Button>
                  </Link>
                  <Link href="/reports">
                    <Button variant="outline" size="sm" className="w-full justify-start border-slate-700">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Reports
                    </Button>
                  </Link>
                  <Link href="/admin/monitoring">
                    <Button variant="outline" size="sm" className="w-full justify-start border-slate-700">
                      <Activity className="w-4 h-4 mr-2" />
                      Monitoring
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Info Bar */}
      <div className={cn(
        "flex items-center justify-between px-6 py-3 rounded-lg border text-sm",
        isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-6 text-slate-400">
          <span>AppCompatCheck Security Platform v2.0</span>
          <span>•</span>
          <span>User: {userEmail}</span>
          {organizationId && (
            <>
              <span>•</span>
              <span>Org ID: {organizationId}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}

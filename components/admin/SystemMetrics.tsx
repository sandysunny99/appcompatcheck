'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Shield, 
  Database, 
  Server, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalScans: number;
  totalRules: number;
  totalReports: number;
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    redis: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    websocket: 'healthy' | 'warning' | 'error';
  };
  performance: {
    avgScanTime: number;
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  usage: {
    dailyScans: number[];
    weeklyUsers: number[];
    monthlyReports: number[];
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
}

export function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Unable to load metrics</h3>
          <p className="text-gray-600">System metrics are currently unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Overview</h2>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {metrics.activeUsers} active
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold">{metrics.totalScans.toLocaleString()}</p>
                <p className="text-xs text-gray-600">
                  {metrics.usage.dailyScans.slice(-1)[0]} today
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold">{metrics.totalRules.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Compatibility checks</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reports Generated</p>
                <p className="text-2xl font-bold">{metrics.totalReports.toLocaleString()}</p>
                <p className="text-xs text-gray-600">
                  {metrics.usage.monthlyReports.slice(-1)[0]} this month
                </p>
              </div>
              <Database className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <Badge className={getHealthColor(metrics.systemHealth.database)}>
                  {getHealthIcon(metrics.systemHealth.database)}
                  {metrics.systemHealth.database}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Redis Cache</span>
                <Badge className={getHealthColor(metrics.systemHealth.redis)}>
                  {getHealthIcon(metrics.systemHealth.redis)}
                  {metrics.systemHealth.redis}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Server</span>
                <Badge className={getHealthColor(metrics.systemHealth.api)}>
                  {getHealthIcon(metrics.systemHealth.api)}
                  {metrics.systemHealth.api}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WebSocket</span>
                <Badge className={getHealthColor(metrics.systemHealth.websocket)}>
                  {getHealthIcon(metrics.systemHealth.websocket)}
                  {metrics.systemHealth.websocket}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Scan Time</span>
                  <span>{metrics.performance.avgScanTime}s</span>
                </div>
                <Progress 
                  value={Math.min(metrics.performance.avgScanTime / 60 * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>API Response Time</span>
                  <span>{metrics.performance.avgResponseTime}ms</span>
                </div>
                <Progress 
                  value={Math.min(metrics.performance.avgResponseTime / 1000 * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Success Rate</span>
                  <span className="text-green-600">{metrics.performance.successRate}%</span>
                </div>
                <Progress 
                  value={metrics.performance.successRate} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Error Rate</span>
                  <span className="text-red-600">{metrics.performance.errorRate}%</span>
                </div>
                <Progress 
                  value={metrics.performance.errorRate} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>{metrics.resources.memoryUsage}%</span>
                </div>
                <Progress 
                  value={metrics.resources.memoryUsage} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>{metrics.resources.cpuUsage}%</span>
                </div>
                <Progress 
                  value={metrics.resources.cpuUsage} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Disk Usage</span>
                  <span>{metrics.resources.diskUsage}%</span>
                </div>
                <Progress 
                  value={metrics.resources.diskUsage} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Active Connections</span>
                  <span>{metrics.resources.activeConnections}</span>
                </div>
                <Progress 
                  value={Math.min(metrics.resources.activeConnections / 100 * 100, 100)} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Daily Scans (Last 7 days)</h4>
                <div className="flex items-end gap-1 h-16">
                  {metrics.usage.dailyScans.map((count, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-t flex-1 min-w-0"
                      style={{ 
                        height: `${Math.max((count / Math.max(...metrics.usage.dailyScans)) * 100, 5)}%` 
                      }}
                      title={`${count} scans`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Weekly Active Users</h4>
                <div className="flex items-end gap-1 h-16">
                  {metrics.usage.weeklyUsers.map((count, index) => (
                    <div
                      key={index}
                      className="bg-green-500 rounded-t flex-1 min-w-0"
                      style={{ 
                        height: `${Math.max((count / Math.max(...metrics.usage.weeklyUsers)) * 100, 5)}%` 
                      }}
                      title={`${count} users`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
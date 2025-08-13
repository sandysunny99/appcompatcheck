'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Database, 
  Server, 
  Users, 
  Clock,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    slowQueries: number;
    averageResponseTime: number;
  };
  redis: {
    memory: number;
    keys: number;
    hitRate: number;
    evictions: number;
  };
  application: {
    activeUsers: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

interface SystemAlert {
  id: string;
  rule: {
    name: string;
    severity: 'critical' | 'warning' | 'info';
  };
  value: number;
  timestamp: number;
  acknowledged: boolean;
  message: string;
}

interface HealthSummary {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  alerts: number;
  uptime: number;
  lastCheck: number;
}

export default function SystemDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch system metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      setCurrentMetrics(data.current);
      setMetrics(data.recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/monitoring/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  // Fetch health summary
  const fetchHealthSummary = async () => {
    try {
      const response = await fetch('/api/monitoring/health');
      if (!response.ok) throw new Error('Failed to fetch health summary');
      
      const data = await response.json();
      setHealthSummary(data);
    } catch (err) {
      console.error('Failed to fetch health summary:', err);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchAlerts(); // Refresh alerts
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMetrics(),
        fetchAlerts(),
        fetchHealthSummary(),
      ]);
      setLoading(false);
    };

    fetchData();

    // Set up real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format memory size
  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb.toFixed(1)}MB`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Summary */}
      {healthSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              {healthSummary.status === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : healthSummary.status === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge className={getStatusColor(healthSummary.status)}>
                  {healthSummary.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Health Score: {healthSummary.score}/100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthSummary.alerts}</div>
              <p className="text-xs text-muted-foreground">
                {alerts.filter(a => a.rule.severity === 'critical').length} critical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUptime(healthSummary.uptime)}</div>
              <p className="text-xs text-muted-foreground">
                Since last restart
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentMetrics?.application.activeUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id} className={getSeverityColor(alert.rule.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <div className="flex justify-between items-start">
                    <div>
                      <AlertDescription className="font-medium">
                        {alert.rule.name}
                      </AlertDescription>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="redis">Redis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {currentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CPU Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    CPU Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {currentMetrics.cpu.usage.toFixed(1)}%
                  </div>
                  <Progress value={currentMetrics.cpu.usage} className="mb-2" />
                  <div className="text-sm text-muted-foreground">
                    Load: {currentMetrics.cpu.load.map(l => l.toFixed(2)).join(', ')}
                  </div>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {currentMetrics.memory.percentage.toFixed(1)}%
                  </div>
                  <Progress value={currentMetrics.memory.percentage} className="mb-2" />
                  <div className="text-sm text-muted-foreground">
                    {formatMemory(currentMetrics.memory.used)} / {formatMemory(currentMetrics.memory.total)}
                  </div>
                </CardContent>
              </Card>

              {/* Database Connections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {currentMetrics.database.connections}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Active: {currentMetrics.database.activeQueries}</div>
                    <div>Slow queries: {currentMetrics.database.slowQueries}</div>
                    <div>Avg response: {currentMetrics.database.averageResponseTime.toFixed(2)}ms</div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Application
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Requests</span>
                      <span className="font-medium">{currentMetrics.application.totalRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Error Rate</span>
                      <span className="font-medium">{currentMetrics.application.errorRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response</span>
                      <span className="font-medium">{currentMetrics.application.averageResponseTime.toFixed(2)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Redis Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-red-500" />
                    Redis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Memory</span>
                      <span className="font-medium">{formatMemory(currentMetrics.redis.memory)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Keys</span>
                      <span className="font-medium">{currentMetrics.redis.keys}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hit Rate</span>
                      <span className="font-medium">{currentMetrics.redis.hitRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {metrics.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CPU Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>CPU Usage Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU Usage']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cpu.usage" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Memory Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Memory Usage']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="memory.percentage" 
                        stroke="#82ca9d" 
                        fill="#82ca9d"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Response Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Average Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Response Time']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="application.averageResponseTime" 
                        stroke="#ff7300" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Active Users Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [value, 'Active Users']}
                      />
                      <Bar dataKey="application.activeUsers" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          {metrics.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database Connections */}
              <Card>
                <CardHeader>
                  <CardTitle>Database Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="database.connections" 
                        stroke="#8884d8" 
                        name="Total Connections"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="database.activeQueries" 
                        stroke="#82ca9d" 
                        name="Active Queries"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Database Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Database Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Response Time']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="database.averageResponseTime" 
                        stroke="#ff7300" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="redis" className="space-y-4">
          {metrics.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Redis Memory */}
              <Card>
                <CardHeader>
                  <CardTitle>Redis Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis tickFormatter={(value) => formatMemory(value)} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [formatMemory(value), 'Memory']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="redis.memory" 
                        stroke="#82ca9d" 
                        fill="#82ca9d"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Redis Hit Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Redis Hit Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Hit Rate']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="redis.hitRate" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
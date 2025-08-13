'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  FileText,
  Shield,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditStatistics {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByResource: Record<string, number>;
  eventsByUser: Record<string, number>;
  eventsByHour: Array<{ hour: string; count: number }>;
  securityEventsBySeverity: Record<string, number>;
}

interface ComplianceReport {
  totalDataAccess: number;
  privilegedOperations: number;
  failedLogins: number;
  dataModifications: number;
  adminActivities: number;
  complianceScore: number;
  recommendations: string[];
}

export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    dateFrom: '',
    dateTo: '',
    limit: 50,
    offset: 0,
  });

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/audit/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/audit/statistics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  // Fetch compliance report
  const fetchComplianceReport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/audit/compliance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch compliance report');
      
      const data = await response.json();
      setComplianceReport(data);
    } catch (err) {
      console.error('Failed to fetch compliance report:', err);
    }
  };

  // Generate report
  const generateReport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch('/api/audit/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateFrom: filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: filters.dateTo || new Date().toISOString(),
          format,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      if (format === 'csv') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-report-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  // Apply filters
  const applyFilters = () => {
    setLoading(true);
    fetchAuditLogs().finally(() => setLoading(false));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resource: '',
      dateFrom: '',
      dateTo: '',
      limit: 50,
      offset: 0,
    });
  };

  // Pagination
  const nextPage = () => {
    setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const prevPage = () => {
    setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAuditLogs(),
        fetchStatistics(),
        fetchComplianceReport(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (filters.dateFrom || filters.dateTo) {
      fetchStatistics();
      fetchComplianceReport();
    }
  }, [filters.dateFrom, filters.dateTo]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('READ') || action.includes('ACCESS')) return 'bg-gray-100 text-gray-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    if (action.includes('SECURITY')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    placeholder="Filter by user..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="action">Action</Label>
                  <Input
                    id="action"
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    placeholder="Filter by action..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="resource">Resource</Label>
                  <Input
                    id="resource"
                    value={filters.resource}
                    onChange={(e) => handleFilterChange('resource', e.target.value)}
                    placeholder="Filter by resource..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="datetime-local"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    id="dateTo"
                    type="datetime-local"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <Button onClick={applyFilters} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {filters.offset + 1} - {Math.min(filters.offset + filters.limit, total)} of {total} logs
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => generateReport('json')}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => generateReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Timestamp</th>
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Action</th>
                      <th className="text-left p-2">Resource</th>
                      <th className="text-left p-2">IP Address</th>
                      <th className="text-left p-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2 text-sm">{log.userId}</td>
                        <td className="p-2">
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">{log.resource}</td>
                        <td className="p-2 text-sm">{log.ipAddress || 'N/A'}</td>
                        <td className="p-2 text-sm">
                          {log.details ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                alert(JSON.stringify(log.details, null, 2));
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={filters.offset === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(total / filters.limit)}
                </span>
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={filters.offset + filters.limit >= total}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {statistics && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalEvents}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.keys(statistics.eventsByUser).length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resources</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.keys(statistics.eventsByResource).length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Security Events</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.values(statistics.securityEventsBySeverity).reduce((a, b) => a + b, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Events by Action */}
                <Card>
                  <CardHeader>
                    <CardTitle>Events by Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(statistics.eventsByAction).map(([action, count]) => ({ action, count }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="action" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Events by Resource */}
                <Card>
                  <CardHeader>
                    <CardTitle>Events by Resource</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(statistics.eventsByResource).map(([resource, count]) => ({ name: resource, value: count }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {Object.entries(statistics.eventsByResource).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Events by Hour */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Events by Hour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={statistics.eventsByHour}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                        />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {complianceReport && (
            <>
              {/* Compliance Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getComplianceScoreColor(complianceReport.complianceScore)}`}>
                        {complianceReport.complianceScore}
                      </div>
                      <p className="text-sm text-muted-foreground">Compliance Score</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Data Access Events</span>
                        <span className="font-medium">{complianceReport.totalDataAccess}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Privileged Operations</span>
                        <span className="font-medium">{complianceReport.privilegedOperations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Failed Logins</span>
                        <span className="font-medium">{complianceReport.failedLogins}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Data Modifications</span>
                        <span className="font-medium">{complianceReport.dataModifications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Admin Activities</span>
                        <span className="font-medium">{complianceReport.adminActivities}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {complianceReport.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {complianceReport.recommendations.map((recommendation, index) => (
                        <Alert key={index} className="border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{recommendation}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
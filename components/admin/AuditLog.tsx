'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Search, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface AuditLogEntry {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'failure' | 'warning';
  ipAddress: string;
  details: string;
}

export function AuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading audit logs
    const fetchAuditLogs = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockLogs: AuditLogEntry[] = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          user: 'admin@appcompatcheck.com',
          action: 'User Login',
          resource: '/auth/login',
          status: 'success',
          ipAddress: '192.168.1.100',
          details: 'Successful login from Chrome browser'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'user@example.com',
          action: 'Scan Created',
          resource: '/api/scans',
          status: 'success',
          ipAddress: '192.168.1.101',
          details: 'Created new compatibility scan for project X'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: 'admin@appcompatcheck.com',
          action: 'Settings Updated',
          resource: '/api/admin/settings',
          status: 'success',
          ipAddress: '192.168.1.100',
          details: 'Updated system configuration'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          user: 'user2@example.com',
          action: 'Failed Login Attempt',
          resource: '/auth/login',
          status: 'failure',
          ipAddress: '192.168.1.102',
          details: 'Invalid credentials'
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          user: 'admin@appcompatcheck.com',
          action: 'User Deleted',
          resource: '/api/admin/users/123',
          status: 'warning',
          ipAddress: '192.168.1.100',
          details: 'Deleted user account with active scans'
        },
      ];
      
      setAuditLogs(mockLogs);
      setIsLoading(false);
    };

    fetchAuditLogs();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>;
      case 'failure':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failure</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      default:
        return null;
    }
  };

  const filteredLogs = auditLogs.filter(log =>
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['ID', 'Timestamp', 'User', 'Action', 'Resource', 'Status', 'IP Address', 'Details'].join(','),
      ...filteredLogs.map(log =>
        [
          log.id,
          log.timestamp,
          log.user,
          log.action,
          log.resource,
          log.status,
          log.ipAddress,
          `"${log.details}"`
        ].join(',')
      )
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            View and search system activity and security events
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            System Activity
          </CardTitle>
          <CardDescription>
            Complete audit trail of all system activities and user actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by user, action, or resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Audit Logs Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-muted-foreground">Loading audit logs...</div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No audit logs found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex justify-center">
                            {getStatusIcon(log.status)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="font-mono text-xs">{log.resource}</TableCell>
                        <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 font-semibold mb-1">
                <CheckCircle className="h-4 w-4" />
                Successful
              </div>
              <div className="text-2xl font-bold text-green-900">
                {auditLogs.filter(log => log.status === 'success').length}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 font-semibold mb-1">
                <XCircle className="h-4 w-4" />
                Failed
              </div>
              <div className="text-2xl font-bold text-red-900">
                {auditLogs.filter(log => log.status === 'failure').length}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-1">
                <AlertCircle className="h-4 w-4" />
                Warnings
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {auditLogs.filter(log => log.status === 'warning').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

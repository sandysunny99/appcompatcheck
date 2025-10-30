'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Calendar, 
  Download,
  BarChart3,
  FileSpreadsheet,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ReportGenerator } from './ReportGenerator';
import { formatDistanceToNow } from 'date-fns';

interface ScanSummary {
  id: number;
  sessionId: string;
  fileName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  totalResults: number;
  riskScore?: number;
  userFirstName: string;
  userLastName: string;
}

interface ReportActivity {
  id: number;
  action: string;
  description: string;
  metadata: any;
  createdAt: string;
  userName: string;
}

interface ReportsDashboardProps {
  userId: number;
  organizationId?: number;
}

export function ReportsDashboard({ userId, organizationId }: ReportsDashboardProps) {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<ReportActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchScans();
    fetchRecentActivity();
  }, []);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/scans');
      if (response.ok) {
        const data = await response.json();
        setScans(data.scans || []);
      }
    } catch (error) {
      console.error('Failed to fetch scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/reports/activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  };

  const handleViewReport = async (scan: ScanSummary) => {
    try {
      // Navigate to the scan results page
      window.location.href = `/scan/results?session=${scan.sessionId}`;
    } catch (error) {
      console.error('Failed to view report:', error);
    }
  };

  const filteredScans = scans.filter(scan => {
    const matchesSearch = scan.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.sessionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || scan.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const scanDate = new Date(scan.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
      case 'processing':
        return <Activity className="w-4 h-4" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getRiskScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 8) return 'bg-red-100 text-red-800';
    if (score >= 6) return 'bg-orange-100 text-orange-800';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      {/* Report Generator */}
      <ReportGenerator userId={userId} organizationId={organizationId || 0} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold">{scans.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Scans</p>
                <p className="text-2xl font-bold text-green-600">
                  {scans.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Running Scans</p>
                <p className="text-2xl font-bold text-blue-600">
                  {scans.filter(s => ['running', 'processing'].includes(s.status)).length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Risk Score</p>
                <p className="text-2xl font-bold">
                  {scans.filter(s => s.riskScore).length > 0
                    ? (scans.reduce((acc, s) => acc + (s.riskScore || 0), 0) / 
                       scans.filter(s => s.riskScore).length).toFixed(1)
                    : 'N/A'
                  }
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Available Scans
              </CardTitle>
              
              {/* Filters */}
              <div className="flex gap-4 items-end pt-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Scans</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by filename or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading scans...
                        </TableCell>
                      </TableRow>
                    ) : filteredScans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No scans found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScans.map((scan) => (
                        <TableRow key={scan.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium truncate max-w-xs">
                                {scan.fileName}
                              </div>
                              <div className="text-sm text-gray-600">
                                ID: {scan.sessionId}
                              </div>
                              <div className="text-sm text-gray-500">
                                by {scan.userFirstName} {scan.userLastName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(scan.status)}>
                              {getStatusIcon(scan.status)}
                              {scan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{scan.totalResults}</span>
                            <span className="text-sm text-gray-500"> results</span>
                          </TableCell>
                          <TableCell>
                            {scan.riskScore ? (
                              <Badge className={getRiskScoreColor(scan.riskScore)}>
                                {scan.riskScore.toFixed(1)}/10
                              </Badge>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={scan.status !== 'completed'}
                              onClick={() => handleViewReport(scan)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              View Report
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
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Report Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No recent activity
                  </div>
                ) : (
                  recentActivity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-1">
                        {activity.action.includes('pdf') ? (
                          <FileText className="w-4 h-4 text-red-500" />
                        ) : activity.action.includes('excel') ? (
                          <FileSpreadsheet className="w-4 h-4 text-green-500" />
                        ) : (
                          <Download className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">
                            by {activity.userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {activity.metadata?.format && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {activity.metadata.format.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
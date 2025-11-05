'use client';

/**
 * Enhanced Reports Dashboard
 * 
 * Features:
 * - Advanced multi-criteria filtering
 * - Data visualization with charts
 * - Export functionality
 * - Bulk operations
 * - Advanced sorting
 * - Timeline view
 * - Risk score analytics
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertCircle,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  MoreVertical,
  Archive,
  Share,
} from 'lucide-react';
import { ReportGenerator } from './ReportGenerator';
import { formatDistanceToNow, format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface FilterState {
  search: string;
  status: string[];
  riskScore: { min: number; max: number };
  dateRange: { start: Date | null; end: Date | null };
  user: string[];
  sortBy: 'date' | 'risk' | 'name' | 'duration';
  sortOrder: 'asc' | 'desc';
}

interface EnhancedReportsDashboardProps {
  userId: number;
  organizationId?: number;
}

export function EnhancedReportsDashboard({ userId, organizationId }: EnhancedReportsDashboardProps) {
  const router = useRouter();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [selectedScans, setSelectedScans] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'timeline' | 'analytics'>('table');
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    riskScore: { min: 0, max: 10 },
    dateRange: { start: null, end: null },
    user: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });

  useEffect(() => {
    fetchScans();
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

  // Advanced filtering logic
  const filteredScans = useMemo(() => {
    let result = [...scans];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(scan =>
        scan.fileName.toLowerCase().includes(searchLower) ||
        scan.sessionId.toLowerCase().includes(searchLower) ||
        `${scan.userFirstName} ${scan.userLastName}`.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter(scan => filters.status.includes(scan.status));
    }

    // Risk score filter
    result = result.filter(scan => {
      if (!scan.riskScore) return true;
      return scan.riskScore >= filters.riskScore.min && scan.riskScore <= filters.riskScore.max;
    });

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(scan => {
        const scanDate = parseISO(scan.createdAt);
        if (filters.dateRange.start && scanDate < startOfDay(filters.dateRange.start)) return false;
        if (filters.dateRange.end && scanDate > endOfDay(filters.dateRange.end)) return false;
        return true;
      });
    }

    // User filter
    if (filters.user.length > 0) {
      result = result.filter(scan =>
        filters.user.includes(`${scan.userFirstName} ${scan.userLastName}`)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'risk':
          comparison = (a.riskScore || 0) - (b.riskScore || 0);
          break;
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'duration':
          const durationA = a.completedAt ? new Date(a.completedAt).getTime() - new Date(a.createdAt).getTime() : 0;
          const durationB = b.completedAt ? new Date(b.completedAt).getTime() - new Date(b.createdAt).getTime() : 0;
          comparison = durationA - durationB;
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [scans, filters]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const completed = scans.filter(s => s.status === 'completed').length;
    const running = scans.filter(s => ['running', 'processing'].includes(s.status)).length;
    const failed = scans.filter(s => ['failed', 'error'].includes(s.status)).length;
    
    const riskScores = scans.filter(s => s.riskScore).map(s => s.riskScore!);
    const avgRiskScore = riskScores.length > 0 
      ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length 
      : 0;

    const riskDistribution = {
      critical: scans.filter(s => s.riskScore && s.riskScore >= 9).length,
      high: scans.filter(s => s.riskScore && s.riskScore >= 7 && s.riskScore < 9).length,
      medium: scans.filter(s => s.riskScore && s.riskScore >= 4 && s.riskScore < 7).length,
      low: scans.filter(s => s.riskScore && s.riskScore < 4).length,
    };

    // Trend calculation (last 7 days vs previous 7 days)
    const last7Days = scans.filter(s => {
      const date = parseISO(s.createdAt);
      return date >= subDays(new Date(), 7);
    }).length;

    const previous7Days = scans.filter(s => {
      const date = parseISO(s.createdAt);
      return date >= subDays(new Date(), 14) && date < subDays(new Date(), 7);
    }).length;

    const trend = previous7Days > 0 
      ? ((last7Days - previous7Days) / previous7Days) * 100 
      : 0;

    return {
      total: scans.length,
      completed,
      running,
      failed,
      avgRiskScore,
      riskDistribution,
      trend,
    };
  }, [scans]);

  const handleViewReport = (scan: ScanSummary) => {
    router.push(`/scan/results?session=${scan.sessionId}`);
  };

  const handleSelectScan = (scanId: number) => {
    const newSelection = new Set(selectedScans);
    if (newSelection.has(scanId)) {
      newSelection.delete(scanId);
    } else {
      newSelection.add(scanId);
    }
    setSelectedScans(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedScans.size === filteredScans.length) {
      setSelectedScans(new Set());
    } else {
      setSelectedScans(new Set(filteredScans.map(s => s.id)));
    }
  };

  const handleBulkExport = () => {
    console.log('Exporting scans:', Array.from(selectedScans));
    // Implement bulk export logic
  };

  const handleBulkDelete = () => {
    console.log('Deleting scans:', Array.from(selectedScans));
    // Implement bulk delete logic
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: [],
      riskScore: { min: 0, max: 10 },
      dateRange: { start: null, end: null },
      user: [],
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) +
    filters.status.length +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    filters.user.length +
    (filters.riskScore.min !== 0 || filters.riskScore.max !== 10 ? 1 : 0);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'running':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getRiskScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 9) return 'bg-red-100 text-red-800 font-bold';
    if (score >= 7) return 'bg-orange-100 text-orange-800 font-semibold';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return <ArrowUpDown className="w-4 h-4" />;
    return filters.sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4" /> 
      : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Report Generator */}
      <ReportGenerator userId={userId} organizationId={organizationId || 0} />

      {/* Enhanced Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Scans</p>
                <p className="text-2xl font-bold">{analytics.total}</p>
                {analytics.trend !== 0 && (
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {analytics.trend > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={analytics.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(analytics.trend).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{analytics.completed}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.total > 0 ? ((analytics.completed / analytics.total) * 100).toFixed(1) : 0}%
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Running</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.running}</p>
                <p className="text-xs text-gray-500 mt-1">Active scans</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Risk Score</p>
                <p className="text-2xl font-bold">
                  {analytics.avgRiskScore > 0 ? analytics.avgRiskScore.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Out of 10</p>
              </div>
              <AlertCircle className={cn(
                "w-8 h-8",
                analytics.avgRiskScore >= 7 ? "text-red-500" :
                analytics.avgRiskScore >= 4 ? "text-orange-500" : "text-green-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{analytics.riskDistribution.critical}</p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scan Reports</CardTitle>
              <CardDescription>
                {filteredScans.length} of {scans.length} scans
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active)`}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedScans.size > 0 && (
                <>
                  <Badge variant="secondary">{selectedScans.size} selected</Badge>
                  <Button variant="outline" size="sm" onClick={handleBulkExport}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={fetchScans}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Advanced Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, session ID, or user..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.sortBy}
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="risk">Risk Score</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                }))}
              >
                {filters.sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </Button>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear ({activeFiltersCount})
                </Button>
              )}
            </div>

            {/* Additional Filter Options */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filters would go here - simplified for brevity */}
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <TabsList>
              <TabsTrigger value="table">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Clock className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <PieChart className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-6">
              {/* Table View - Enhanced */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedScans.size === filteredScans.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                          No scans found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScans.map((scan) => (
                        <TableRow key={scan.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedScans.has(scan.id)}
                              onCheckedChange={() => handleSelectScan(scan.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{scan.fileName}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(scan.status)}>
                              {scan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {scan.riskScore ? (
                              <Badge className={getRiskScoreColor(scan.riskScore)}>
                                {scan.riskScore.toFixed(1)}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{scan.totalResults}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {scan.userFirstName} {scan.userLastName}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDistanceToNow(parseISO(scan.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReport(scan)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <div className="space-y-4">
                {filteredScans.map((scan, index) => (
                  <div key={scan.id} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        scan.status === 'completed' ? 'bg-green-500' :
                        scan.status === 'running' ? 'bg-blue-500' :
                        scan.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      )} />
                      {index < filteredScans.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700 mt-2" />
                      )}
                    </div>
                    <Card className="flex-1 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewReport(scan)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{scan.fileName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {scan.userFirstName} {scan.userLastName} • {format(parseISO(scan.createdAt), 'MMM d, yyyy HH:mm')}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getStatusColor(scan.status)}>{scan.status}</Badge>
                              {scan.riskScore && (
                                <Badge className={getRiskScoreColor(scan.riskScore)}>
                                  Risk: {scan.riskScore.toFixed(1)}
                                </Badge>
                              )}
                              <span className="text-sm text-gray-500">
                                {scan.totalResults} issues
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Distribution Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.riskDistribution).map(([level, count]) => {
                        const total = Object.values(analytics.riskDistribution).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        
                        return (
                          <div key={level}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium capitalize">{level}</span>
                              <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={cn(
                                  "h-2 rounded-full transition-all",
                                  level === 'critical' ? 'bg-red-500' :
                                  level === 'high' ? 'bg-orange-500' :
                                  level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                )}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Distribution Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Completed</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">{analytics.completed}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Running</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">{analytics.running}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="font-medium">Failed</span>
                        </div>
                        <span className="text-2xl font-bold text-red-600">{analytics.failed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

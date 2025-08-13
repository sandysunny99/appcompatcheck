'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Shield, 
  Users, 
  Building, 
  Activity, 
  Database,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { RuleManagement } from './RuleManagement';
import { UserManagement } from './UserManagement';
import { OrganizationManagement } from './OrganizationManagement';
import { SystemConfiguration } from './SystemConfiguration';
import { SystemMetrics } from './SystemMetrics';
import { AuditLog } from './AuditLog';

interface AdminDashboardProps {
  userId: number;
  userRole: string;
}

export function AdminDashboard({ userId, userRole }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Links to Monitoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/monitoring'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Monitoring</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Live</div>
                <p className="text-xs text-muted-foreground">
                  Real-time system metrics and alerts
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/audit'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">
                  Security events and compliance reports
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">Good</div>
                <p className="text-xs text-yellow-600">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          <SystemMetrics />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <RuleManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <OrganizationManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemConfiguration />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}